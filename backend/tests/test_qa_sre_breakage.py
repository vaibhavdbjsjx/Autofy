import pytest
import json
import hmac
import hashlib
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from models.user import User
from models.business import Business
from models.lead import Lead
from models.service import Service
from models.appointment import Appointment
from models.order import Order
from models.product import Product
from models.invoice import Invoice
from models.payment import Payment
from models.conversation import Conversation
from models.message import Message
from models.faq import FAQ
from models.business_policy import BusinessPolicy
from models.uploaded_document import UploadedDocument
from auth.security import create_access_token


# =====================================================================
# 1. PAYMENT & INVOICE BREAKAGE TESTS
# =====================================================================

def test_payment_invoice_streaming_and_tenant_isolation(client: TestClient, db_session: Session):
    """
    Test 1: Tests that GET /api/v1/payments/{payment_id}/invoice does NOT crash (no NameError)
    and strictly enforces tenant isolation.
    """
    # Tenant A
    biz_a = Business(id="biz-pay-a", name="Tenant A Auto", email="tenanta@pay.com", is_onboarded=True)
    db_session.add(biz_a)
    db_session.flush()

    user_a = User(id="usr-pay-a", business_id=biz_a.id, name="Owner A", email="owner@tenanta.com", password_hash="h", role="Owner", status="Active")
    db_session.add(user_a)

    pay_a = Payment(
        id="pay-rec-001",
        business_id=biz_a.id,
        amount=500.00,
        currency="INR",
        status="paid",
        description="Engine Oil Flush",
        created_at=datetime.utcnow()
    )
    db_session.add(pay_a)

    # Tenant B
    biz_b = Business(id="biz-pay-b", name="Tenant B Salon", email="tenantb@pay.com", is_onboarded=True)
    db_session.add(biz_b)
    db_session.flush()

    user_b = User(id="usr-pay-b", business_id=biz_b.id, name="Owner B", email="owner@tenantb.com", password_hash="h", role="Owner", status="Active")
    db_session.add(user_b)
    db_session.commit()

    token_a = create_access_token(subject=user_a.id, additional_claims={"business_id": biz_a.id, "role": "Owner"})
    token_b = create_access_token(subject=user_b.id, additional_claims={"business_id": biz_b.id, "role": "Owner"})

    # 1. Tenant A fetches own payment invoice -> should succeed (200 HTML)
    res_a = client.get(f"/api/v1/payments/{pay_a.id}/invoice", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == status.HTTP_200_OK
    assert "text/html" in res_a.headers["content-type"]
    assert "Engine Oil Flush" in res_a.text

    # 2. Tenant B attempts IDOR attack to fetch Tenant A's payment invoice -> should return 404
    res_b = client.get(f"/api/v1/payments/{pay_a.id}/invoice", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == status.HTTP_404_NOT_FOUND


def test_subscription_invoice_cross_tenant_idor(client: TestClient, db_session: Session):
    """
    Test 2: Tenant B cannot download Tenant A's subscription tax invoice.
    """
    biz_a = Business(id="biz-sub-a", name="Tenant Sub A", email="suba@test.com", is_onboarded=True)
    biz_b = Business(id="biz-sub-b", name="Tenant Sub B", email="subb@test.com", is_onboarded=True)
    db_session.add_all([biz_a, biz_b])
    db_session.flush()

    user_a = User(id="usr-sub-a", business_id=biz_a.id, name="Sub Owner A", email="suba@test.com", password_hash="h", role="Owner", status="Active")
    user_b = User(id="usr-sub-b", business_id=biz_b.id, name="Sub Owner B", email="subb@test.com", password_hash="h", role="Owner", status="Active")
    db_session.add_all([user_a, user_b])

    inv_a = Invoice(
        id="inv-sub-001",
        business_id=biz_a.id,
        invoice_number="INV-2026-A1",
        subtotal=699.00,
        tax_amount=125.82,
        total_amount=824.82,
        currency="INR",
        status="paid"
    )
    db_session.add(inv_a)
    db_session.commit()

    token_b = create_access_token(subject=user_b.id, additional_claims={"business_id": biz_b.id, "role": "Owner"})
    res = client.get(f"/api/v1/subscriptions/invoices/{inv_a.id}/download", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == status.HTTP_404_NOT_FOUND


# =====================================================================
# 2. ORDER REFUND & STOCK TAMPERING TESTS
# =====================================================================

def test_order_refund_negative_amount_rejection(client: TestClient, db_session: Session):
    """
    Test 3: Submitting negative refund amounts or claiming refunds exceeding total price is rejected.
    """
    biz = Business(id="biz-ord-01", name="Order Store", email="ord@store.com", is_onboarded=True)
    db_session.add(biz)
    db_session.flush()

    user = User(id="usr-ord-01", business_id=biz.id, name="Store Owner", email="ord@store.com", password_hash="h", role="Owner", status="Active")
    db_session.add(user)

    order = Order(
        id="ord-test-01",
        business_id=biz.id,
        customer_name="Rohan Sharma",
        customer_email="rohan@gmail.com",
        shipping_address="123 MG Road, Bangalore",
        total_price=Decimal("1000.00"),
        status="Delivered",
        items_json="[]"
    )
    db_session.add(order)
    db_session.commit()

    token = create_access_token(subject=user.id, additional_claims={"business_id": biz.id, "role": "Owner"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Negative refund amount -> should be rejected with 400
    res_neg = client.post(f"/api/v1/orders/{order.id}/refund", json={"refund_amount": -200.00, "reason": "Fraud Attempt"}, headers=headers)
    assert res_neg.status_code == status.HTTP_400_BAD_REQUEST

    # 2. Excessive refund amount (₹1500 on ₹1000 order) -> should be rejected with 400
    res_excess = client.post(f"/api/v1/orders/{order.id}/refund", json={"refund_amount": 1500.00, "reason": "Overclaim"}, headers=headers)
    assert res_excess.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Valid partial refund (₹400) -> should succeed
    res_valid = client.post(f"/api/v1/orders/{order.id}/refund", json={"refund_amount": 400.00, "reason": "Defective item"}, headers=headers)
    assert res_valid.status_code == status.HTTP_200_OK
    assert res_valid.json()["status"] == "Refunded"
    assert Decimal(str(res_valid.json()["refund_amount"])) == Decimal("400.00")


# =====================================================================
# 3. KNOWLEDGE BASE & FAQ CROSS-TENANT ISOLATION
# =====================================================================

def test_knowledge_base_cross_tenant_mutation_isolation(client: TestClient, db_session: Session):
    """
    Test 4: Tenant B cannot update or delete Tenant A's FAQs, Policies, or Services.
    """
    biz_a = Business(id="biz-kb-a", name="Tenant A Academy", email="kba@test.com", is_onboarded=True)
    biz_b = Business(id="biz-kb-b", name="Tenant B Academy", email="kbb@test.com", is_onboarded=True)
    db_session.add_all([biz_a, biz_b])
    db_session.flush()

    user_a = User(id="usr-kb-a", business_id=biz_a.id, name="Admin A", email="kba@test.com", password_hash="h", role="Admin", status="Active")
    user_b = User(id="usr-kb-b", business_id=biz_b.id, name="Admin B", email="kbb@test.com", password_hash="h", role="Admin", status="Active")
    db_session.add_all([user_a, user_b])

    faq_a = FAQ(
        id="faq-a-001",
        business_id=biz_a.id,
        question="What is the refund policy?",
        answer="100% refund within 7 days."
    )
    policy_a = BusinessPolicy(
        id="pol-a-001",
        business_id=biz_a.id,
        title="Privacy Policy",
        content="We do not sell data."
    )
    db_session.add_all([faq_a, policy_a])
    db_session.commit()

    token_b = create_access_token(subject=user_b.id, additional_claims={"business_id": biz_b.id, "role": "Admin"})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Tenant B tries to delete Tenant A's FAQ -> 404
    res_faq_del = client.delete(f"/api/v1/knowledge/faqs/{faq_a.id}", headers=headers_b)
    assert res_faq_del.status_code == status.HTTP_404_NOT_FOUND

    # 2. Tenant B tries to update Tenant A's Policy -> 404
    res_pol_upd = client.put(f"/api/v1/knowledge/policies/{policy_a.id}", json={"title": "Hacked Policy", "content": "All data leaked"}, headers=headers_b)
    assert res_pol_upd.status_code == status.HTTP_404_NOT_FOUND


# =====================================================================
# 4. WHATSAPP WEBHOOK CHAOS & SPOOFED PAYLOADS
# =====================================================================

def test_whatsapp_webhook_malformed_and_empty_payloads(client: TestClient):
    """
    Test 5: Webhook listener gracefully survives completely empty or malformed JSON payloads.
    """
    # 1. Completely empty body
    res_empty = client.post("/api/v1/whatsapp/webhook", json={})
    assert res_empty.status_code == status.HTTP_200_OK

    # 2. Non-WhatsApp object payload
    res_unknown = client.post("/api/v1/whatsapp/webhook", json={"object": "unknown_entity", "entry": []})
    assert res_unknown.status_code == status.HTTP_200_OK

    # 3. Corrupted entry structure (missing 'changes' or null values)
    res_corrupt = client.post("/api/v1/whatsapp/webhook", json={
        "object": "whatsapp_business_account",
        "entry": [{"id": "waba_1", "changes": None}]
    })
    assert res_corrupt.status_code == status.HTTP_200_OK


# =====================================================================
# 5. AI KILL-SWITCH ENFORCEMENT
# =====================================================================

def test_ai_kill_switch_strictly_suppresses_automated_replies(db_session: Session):
    """
    Test 6: When ai_auto_reply_enabled is False, ConversationalAIService returns None/suppressed.
    """
    from services.conversation_services import ConversationalAIService

    biz = Business(
        id="biz-ai-kill",
        name="Emergency Stop Motors",
        email="ai@stop.com",
        is_onboarded=True,
        ai_auto_reply_enabled=False # Kill-switch engaged!
    )
    db_session.add(biz)
    db_session.flush()

    conv = Conversation(
        id="conv-ai-kill-01",
        business_id=biz.id,
        platform_sender_id="+919888877777",
        channel="WhatsApp",
        ai_enabled=True
    )
    db_session.add(conv)
    db_session.commit()

    reply = ConversationalAIService.reply_with_ai(
        db=db_session,
        conversation_id=conv.id,
        incoming_message="Do you do same-day oil changes?"
    )
    assert reply.get("reply") is None
    assert reply.get("escalate") is True
    assert reply.get("suppressed_by_kill_switch") is True


# =====================================================================
# 6. RBAC PRIVILEGE ESCALATION ATTACKS
# =====================================================================

def test_rbac_privilege_escalation_blocked(client: TestClient, db_session: Session):
    """
    Test 7: Support Agents and Sales Agents cannot trigger Owner/Admin mutations:
    - Cannot toggle AI kill-switch
    - Cannot invite new team members
    - Cannot delete products from catalog
    - Cannot delete orders
    """
    biz = Business(id="biz-rbac-test", name="RBAC Fortress", email="rbac@fortress.com", is_onboarded=True)
    db_session.add(biz)
    db_session.flush()

    support_user = User(
        id="usr-support-agent",
        business_id=biz.id,
        name="Support Agent Sam",
        email="sam@fortress.com",
        password_hash="h",
        role="Support Agent",
        status="Active"
    )
    prod = Product(
        id="prod-rbac-01",
        business_id=biz.id,
        name="Sensitive Hardware",
        price=Decimal("5000.00"),
        stock=10
    )
    order = Order(
        id="ord-rbac-01",
        business_id=biz.id,
        customer_name="Client X",
        customer_email="clientx@gmail.com",
        shipping_address="77 Indiranagar, Bangalore",
        total_price=Decimal("5000.00"),
        status="Delivered",
        items_json="[]"
    )
    db_session.add_all([support_user, prod, order])
    db_session.commit()

    token = create_access_token(subject=support_user.id, additional_claims={"business_id": biz.id, "role": "Support Agent"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Support Agent attempts to disable AI kill switch -> 403 Forbidden
    res_ai = client.patch("/api/v1/business/ai-kill-switch", json={"enabled": False}, headers=headers)
    assert res_ai.status_code == status.HTTP_403_FORBIDDEN

    # 2. Support Agent attempts to invite a team member -> 403 Forbidden
    res_inv = client.post("/api/v1/team/invite", json={"name": "Attacker", "email": "attacker@evil.com", "role": "Owner"}, headers=headers)
    assert res_inv.status_code == status.HTTP_403_FORBIDDEN

    # 3. Support Agent attempts to delete product -> 403 Forbidden
    res_pdel = client.delete(f"/api/v1/products/{prod.id}", headers=headers)
    assert res_pdel.status_code == status.HTTP_403_FORBIDDEN

    # 4. Support Agent attempts to delete order -> 403 Forbidden
    res_odel = client.delete(f"/api/v1/orders/{order.id}", headers=headers)
    assert res_odel.status_code == status.HTTP_403_FORBIDDEN

