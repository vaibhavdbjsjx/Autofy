import pytest
import io
import csv
from datetime import datetime
from decimal import Decimal
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import inspect

from models.user import User
from models.business import Business
from models.lead import Lead
from models.conversation import Conversation
from models.message import Message
from models.payment import Payment
from models.subscription import Subscription
from models.appointment import Appointment
from models.activity_log import ActivityLog
from auth.security import create_access_token
from services.queue_services import JobQueueService, WebhookJob


# =====================================================================
# 1. DATABASE RELIABILITY & INDEXES VERIFICATION
# =====================================================================

def test_database_table_indexes_exist():
    """
    Verifies that compound indexes on high-throughput tables exist in metadata.
    """
    # Messages
    msg_idx_names = [idx.name for idx in Message.__table__.indexes]
    assert "ix_messages_conv_created" in msg_idx_names
    assert "ix_messages_whatsapp_status" in msg_idx_names

    # Conversations
    conv_idx_names = [idx.name for idx in Conversation.__table__.indexes]
    assert "ix_conversations_biz_status_updated" in conv_idx_names
    assert "ix_conversations_biz_sender" in conv_idx_names

    # Leads
    lead_idx_names = [idx.name for idx in Lead.__table__.indexes]
    assert "ix_leads_biz_phone" in lead_idx_names
    assert "ix_leads_biz_status" in lead_idx_names
    assert "ix_leads_biz_stage" in lead_idx_names
    assert "ix_leads_biz_created" in lead_idx_names

    # Payments
    pay_idx_names = [idx.name for idx in Payment.__table__.indexes]
    assert "ix_payments_biz_status_created" in pay_idx_names
    assert "ix_payments_biz_lead" in pay_idx_names

    # Subscriptions
    sub_idx_names = [idx.name for idx in Subscription.__table__.indexes]
    assert "ix_subscriptions_biz_status" in sub_idx_names

    # Appointments
    appt_idx_names = [idx.name for idx in Appointment.__table__.indexes]
    assert "ix_appointments_biz_date" in appt_idx_names
    assert "ix_appointments_biz_status" in appt_idx_names

    # Activity Logs
    act_idx_names = [idx.name for idx in ActivityLog.__table__.indexes]
    assert "ix_activity_logs_biz_created" in act_idx_names
    assert "ix_activity_logs_biz_action" in act_idx_names


# =====================================================================
# 2. BACKGROUND QUEUE, DLQ & TELEMETRY
# =====================================================================

def test_system_queue_status_and_rate_limits(client: TestClient):
    """
    Verifies /api/v1/system/queue/status and /api/v1/system/rate-limits/status.
    """
    res_q = client.get("/api/v1/system/queue/status")
    assert res_q.status_code == status.HTTP_200_OK
    assert res_q.json()["status"] == "healthy"
    assert "telemetry" in res_q.json()

    res_rl = client.get("/api/v1/system/rate-limits/status")
    assert res_rl.status_code == status.HTTP_200_OK
    assert "default_limit_per_minute" in res_rl.json()


def test_system_deep_health_check(client: TestClient):
    """
    Verifies multi-subsystem deep health check (/api/v1/system/health-deep).
    """
    res = client.get("/api/v1/system/health-deep")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data["subsystems"]
    assert data["subsystems"]["database"]["status"] == "healthy"
    assert "background_queue" in data["subsystems"]
    assert "gemini_ai" in data["subsystems"]
    assert "whatsapp_cloud_api" in data["subsystems"]
    assert "payment_gateway" in data["subsystems"]


# =====================================================================
# 3. DATA EXPORT & COMPLIANCE CSV ENDPOINTS
# =====================================================================

def test_customer_and_financial_data_exports_with_isolation(client: TestClient, db_session: Session):
    """
    Verifies CSV data exports for leads, conversations, and invoices with strict tenant isolation.
    """
    # Tenant A
    biz_a = Business(id="biz-exp-a", name="Tenant A Corp", email="expa@test.com", is_onboarded=True)
    db_session.add(biz_a)
    db_session.flush()

    user_a = User(id="usr-exp-a", business_id=biz_a.id, name="Owner A", email="expa@test.com", password_hash="h", role="Owner", status="Active")
    lead_a = Lead(id="lead-exp-a1", business_id=biz_a.id, name="Kavita Reddy", email="kavita@reddy.com", phone="+919876543210", status="Qualified")
    conv_a = Conversation(id="conv-exp-a1", business_id=biz_a.id, platform_sender_id="+919876543210", channel="WhatsApp", summary="Pricing inquiry")
    pay_a = Payment(id="pay-exp-a1", business_id=biz_a.id, amount=1200.00, currency="INR", status="paid", invoice_id="INV-2026-EXP-A1")

    # Tenant B
    biz_b = Business(id="biz-exp-b", name="Tenant B Corp", email="expb@test.com", is_onboarded=True)
    db_session.add(biz_b)
    db_session.flush()

    user_b = User(id="usr-exp-b", business_id=biz_b.id, name="Owner B", email="expb@test.com", password_hash="h", role="Owner", status="Active")
    lead_b = Lead(id="lead-exp-b1", business_id=biz_b.id, name="Secret Tenant B Client", email="secret@b.com", phone="+919999900000", status="New")

    db_session.add_all([user_a, lead_a, conv_a, pay_a, user_b, lead_b])
    db_session.commit()

    token_a = create_access_token(subject=user_a.id, additional_claims={"business_id": biz_a.id, "role": "Owner"})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 1. Export Customers CSV
    res_cust = client.get("/api/v1/business/export/customers", headers=headers_a)
    assert res_cust.status_code == status.HTTP_200_OK
    assert "text/csv" in res_cust.headers["content-type"]
    assert "Kavita Reddy" in res_cust.text
    assert "Secret Tenant B Client" not in res_cust.text # Strict isolation verified

    # 2. Export Conversations CSV
    res_conv = client.get("/api/v1/business/export/conversations", headers=headers_a)
    assert res_conv.status_code == status.HTTP_200_OK
    assert "text/csv" in res_conv.headers["content-type"]
    assert "Pricing inquiry" in res_conv.text

    # 3. Export Invoices CSV
    res_inv = client.get("/api/v1/business/export/invoices", headers=headers_a)
    assert res_inv.status_code == status.HTTP_200_OK
    assert "text/csv" in res_inv.headers["content-type"]
    assert "INV-2026-EXP-A1" in res_inv.text
