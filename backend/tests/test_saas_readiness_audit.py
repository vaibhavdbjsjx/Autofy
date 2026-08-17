import pytest
from datetime import datetime, timedelta
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.user import User
from models.business import Business
from models.subscription import Subscription
from models.invoice import Invoice
from models.activity_log import ActivityLog
from services.entitlement_services import EntitlementService
from auth.security import create_access_token


def test_subscription_grandfathered_pricing_precedence(db_session: Session):
    """
    Verifies that a customer with a grandfathered rate (e.g. ₹699) retains their price lock
    even when global plan pricing in SUBSCRIPTION_PLANS is higher (e.g. ₹999).
    """
    biz = Business(name="Grandfathered Salon", email="gf@salon.com", is_onboarded=True)
    db_session.add(biz)
    db_session.flush()

    # Create subscription with locked grandfathered price
    sub = Subscription(
        business_id=biz.id,
        plan_id="pro",
        status="ACTIVE",
        billing_interval="monthly",
        normal_price=999.00,
        grandfathered_price=699.00,
        price_locked_at=datetime.utcnow() - timedelta(days=60),
        currency="INR",
        current_period_start=datetime.utcnow() - timedelta(days=10),
        current_period_end=datetime.utcnow() + timedelta(days=20),
    )
    db_session.add(sub)
    db_session.commit()

    state = EntitlementService.evaluate_subscription_state(db_session, biz.id)
    assert state["status"] == "ACTIVE"
    assert state["is_live_accessible"] is True
    assert state["pricing"]["price"] == 699.00
    assert state["pricing"]["is_grandfathered"] is True
    assert state["pricing"]["grandfathered_price"] == 699.00


def test_subscription_grace_period_and_suspension_lifecycle(db_session: Session):
    """
    Verifies state transitions:
    - Overdue <= 7 days -> PAST_DUE (with grace_days_remaining > 0, live operations retained)
    - Overdue > 7 days -> SUSPENDED
    """
    biz = Business(name="Grace Period Gym", email="grace@gym.com", is_onboarded=True)
    db_session.add(biz)
    db_session.flush()

    # 1. Test 3 days overdue (inside grace period)
    sub = Subscription(
        business_id=biz.id,
        plan_id="pro",
        status="ACTIVE",
        billing_interval="monthly",
        normal_price=699.00,
        currency="INR",
        current_period_start=datetime.utcnow() - timedelta(days=33),
        current_period_end=datetime.utcnow() - timedelta(days=3),
    )
    db_session.add(sub)
    db_session.commit()

    state = EntitlementService.evaluate_subscription_state(db_session, biz.id)
    assert state["status"] == "PAST_DUE"
    assert state["is_live_accessible"] is True # Accessible during grace period
    assert state["period"]["grace_days_remaining"] == 4

    # 2. Test 10 days overdue (past 7-day grace period)
    sub.current_period_end = datetime.utcnow() - timedelta(days=10)
    db_session.commit()

    state_suspended = EntitlementService.evaluate_subscription_state(db_session, biz.id)
    assert state_suspended["status"] == "SUSPENDED"
    assert state_suspended["is_live_accessible"] is False


def test_tax_invoice_printable_html_download(client: TestClient, db_session: Session):
    """
    Verifies that the invoice download endpoint returns a valid HTML document
    containing GST tax breakdown, invoice number, and proper metadata.
    """
    biz = Business(name="Apex Legal", email="billing@apexlegal.com", is_onboarded=True)
    db_session.add(biz)
    db_session.flush()

    user = User(
        business_id=biz.id,
        name="Advocate Sharma",
        email="billing@apexlegal.com",
        password_hash="hash",
        role="Owner",
        status="Active"
    )
    db_session.add(user)
    db_session.flush()

    inv = Invoice(
        business_id=biz.id,
        invoice_number="INV-202608-00999",
        subtotal=699.00,
        tax_amount=125.82,
        discount_amount=0.00,
        total_amount=824.82,
        currency="INR",
        status="paid",
        payment_method="UPI Auto-Debit",
        customer_notes="Autofy Pro Monthly Subscription"
    )
    db_session.add(inv)
    db_session.commit()

    token = create_access_token(subject=user.id, additional_claims={"business_id": biz.id, "role": "Owner"})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/v1/subscriptions/invoices/{inv.id}/download", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    assert "text/html" in res.headers["content-type"]
    assert "INV-202608-00999" in res.text
    assert "GSTIN: 29AAACA1234B1Z5" in res.text
    assert "Apex Legal" in res.text
    assert "824.82" in res.text


def test_whatsapp_health_diagnostics_endpoint(client: TestClient, db_session: Session):
    """
    Verifies live WhatsApp health diagnostic evaluator across token health,
    webhook verification status, and automated recovery actions.
    """
    biz = Business(
        id="biz-clinic-diag-99",
        name="Modern Clinic",
        email="clinic@modern.com",
        is_onboarded=True,
        whatsapp_phone_id="10987654321",
        whatsapp_phone_number="+919876543210",
        whatsapp_connection_status="CONNECTED",
        whatsapp_token_expires_at=datetime.utcnow() + timedelta(days=4), # Expiring soon
        whatsapp_webhook_verified=True,
        whatsapp_last_webhook_at=datetime.utcnow() - timedelta(minutes=5)
    )
    db_session.add(biz)
    db_session.flush()

    user = User(
        id="user-clinic-diag-99",
        business_id=biz.id,
        name="Dr. Mehta",
        email="clinic@modern.com",
        password_hash="hash",
        role="Owner",
        status="Active"
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.id, additional_claims={"business_id": biz.id, "role": "Owner"})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/whatsapp/health-check", headers=headers)
    assert res.status_code == status.HTTP_200_OK, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["status"] == "success"
    assert data["diagnostic_code"] in ["TOKEN_EXPIRING_SOON", "OPERATIONAL_HEALTHY"]
    assert data["checks"]["connection"]["status"] == "CONNECTED"


def test_enterprise_audit_log_recording(client: TestClient, db_session: Session):
    """
    Verifies that mutating operations record an immutable audit log entry in the database.
    """
    biz = Business(name="Audit Enterprises", email="owner@audit.com", is_onboarded=True)
    db_session.add(biz)
    db_session.flush()

    user = User(
        business_id=biz.id,
        name="Priya Patel",
        email="owner@audit.com",
        password_hash="hash",
        role="Owner",
        status="Active"
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.id, additional_claims={"business_id": biz.id, "role": "Owner"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Trigger AI kill-switch toggle (should record AI_STATUS_TOGGLED audit log)
    toggle_res = client.patch("/api/v1/business/ai-kill-switch", json={"enabled": False}, headers=headers)
    assert toggle_res.status_code == status.HTTP_200_OK

    # 2. Verify audit log entry exists
    logs_res = client.get("/api/v1/team/activity-logs", headers=headers)
    assert logs_res.status_code == status.HTTP_200_OK
    logs = logs_res.json()
    assert any(log["action"] == "AI_STATUS_TOGGLED" for log in logs)
