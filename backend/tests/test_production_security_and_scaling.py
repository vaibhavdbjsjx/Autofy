import pytest
import hmac
import hashlib
import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from auth.security import create_access_token, create_password_reset_token, decode_password_reset_token
from config import settings
from models.business import Business
from models.user import User
from models.lead import Lead
from models.conversation import Conversation
from models.message import Message
from models.payment import Payment
from models.subscription import Subscription


def test_jwt_invalid_or_expired_claims_rejected(client: TestClient, db_session):
    """
    Ensures forged, expired, or non-access JWT tokens are strictly rejected with HTTP 401.
    """
    # 1. Invalid signature
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert res.status_code == 401

    # 2. Expired access token
    expired_token = create_access_token("test-user-id", expires_delta=timedelta(seconds=-10))
    res_expired = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_expired.status_code == 401

    # 3. Password reset token used as access token
    reset_tok = create_password_reset_token("user@example.com")
    res_wrong_type = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {reset_tok}"}
    )
    assert res_wrong_type.status_code == 401


def test_password_reset_flow_end_to_end(client: TestClient, db_session):
    """
    Tests forgot password token generation and password reset execution.
    """
    # Create test user
    biz = Business(name="Reset Test Biz", email="reset_test@example.com")
    db_session.add(biz)
    db_session.flush()

    user = User(
        business_id=biz.id,
        name="Reset Test User",
        email="reset_test@example.com",
        password_hash="old_hashed_password",
        role="Owner",
        status="Active"
    )
    db_session.add(user)
    db_session.commit()

    # Request password reset
    forgot_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset_test@example.com"}
    )
    assert forgot_res.status_code == 200
    token = forgot_res.json().get("reset_token")
    assert token is not None

    # Reset password with valid token
    reset_res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "brand_new_secure_password_123"}
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "success"

    # Verify invalid token rejected
    bad_reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "tampered_token_string", "new_password": "another_new_password_123"}
    )
    assert bad_reset.status_code == 400


def test_whatsapp_webhook_signature_verification_enforcement(client: TestClient, monkeypatch):
    """
    Verifies that X-Hub-Signature-256 is validated against META_APP_SECRET when configured.
    """
    monkeypatch.setattr("config.settings.META_APP_SECRET", "super_secret_meta_key")

    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": "999888777"},
                    "messages": []
                }
            }]
        }]
    }
    raw_bytes = json.dumps(payload).encode("utf-8")

    # 1. Invalid signature
    res_bad = client.post(
        "/api/v1/whatsapp/webhook",
        content=raw_bytes,
        headers={"X-Hub-Signature-256": "sha256=invalid_signature_hex"}
    )
    assert res_bad.status_code == 401

    # 2. Valid signature
    valid_sig = hmac.new("super_secret_meta_key".encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()
    res_good = client.post(
        "/api/v1/whatsapp/webhook",
        content=raw_bytes,
        headers={"X-Hub-Signature-256": f"sha256={valid_sig}"}
    )
    assert res_good.status_code == 200


def test_whatsapp_webhook_idempotency_duplicate_prevention(client: TestClient, db_session, monkeypatch):
    """
    Verifies that duplicate webhook deliveries for the same message ID are ignored cleanly.
    """
    monkeypatch.setattr("config.settings.META_APP_SECRET", "")

    biz = Business(name="Idempotent Biz", email="idem@example.com", whatsapp_phone_id="123456789")
    db_session.add(biz)
    db_session.commit()

    wamid = "wamid.HBgLMzkxMjM0NTY3ODkVAjIAEhggQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUEA"
    webhook_payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": "123456789"},
                    "contacts": [{"profile": {"name": "Test Customer"}}],
                    "messages": [{
                        "from": "919999988888",
                        "id": wamid,
                        "type": "text",
                        "text": {"body": "Hello there"}
                    }]
                }
            }]
        }]
    }

    # First delivery
    res1 = client.post("/api/v1/whatsapp/webhook", json=webhook_payload)
    assert res1.status_code == 200

    # Second delivery (duplicate wamid)
    res2 = client.post("/api/v1/whatsapp/webhook", json=webhook_payload)
    assert res2.status_code == 200
    assert res2.json().get("status") == "ignored"
    assert "Duplicate" in res2.json().get("reason", "")


def test_razorpay_webhook_payment_failed_and_cancellation(client: TestClient, db_session, monkeypatch):
    """
    Verifies that payment.failed and subscription.cancelled events update ledger states accurately.
    """
    monkeypatch.setattr("config.settings.RAZORPAY_WEBHOOK_SECRET", "")

    biz = Business(name="Billing Test Biz", email="billing_test@example.com")
    db_session.add(biz)
    db_session.flush()

    sub = Subscription(
        business_id=biz.id,
        plan_id="pro",
        provider_subscription_id="sub_test_12345",
        status="ACTIVE",
        normal_price=2499.0
    )
    db_session.add(sub)

    pay = Payment(
        business_id=biz.id,
        amount=2499.0,
        razorpay_payment_id="pay_fail_test_123",
        status="issued"
    )
    db_session.add(pay)
    db_session.commit()

    # 1. Payment failed event
    fail_payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_fail_test_123"
                }
            }
        }
    }
    res_fail = client.post("/api/v1/payments/webhook", json=fail_payload)
    assert res_fail.status_code == 200

    db_session.expire_all()
    updated_pay = db_session.query(Payment).filter(Payment.id == pay.id).first()
    assert updated_pay.status == "failed"

    # 2. Subscription cancelled event
    cancel_payload = {
        "event": "subscription.cancelled",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_test_12345",
                    "notes": {"business_id": biz.id}
                }
            }
        }
    }
    res_cancel = client.post("/api/v1/payments/webhook", json=cancel_payload)
    assert res_cancel.status_code == 200

    db_session.expire_all()
    updated_sub = db_session.query(Subscription).filter(Subscription.id == sub.id).first()
    assert updated_sub.status == "CANCELLED"
