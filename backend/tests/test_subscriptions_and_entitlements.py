import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.subscription import Subscription
from models.user import User
from services.entitlement_services import EntitlementService

def test_new_business_subscription_initial_state(db_session: Session):
    """
    Verify brand-new business gets 'EXPLORING' status on Autofy Pro plan with zero fake paid status.
    """
    biz = Business(id="biz-sub-new", name="New Biz", email="newbiz@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    state = EntitlementService.evaluate_subscription_state(db_session, "biz-sub-new")
    assert state["status"] == "EXPLORING"
    assert state["plan_id"] == "free"
    assert state["product_name"] == "Free Tier"
    assert state["is_live_accessible"] is False
    assert state["is_paid"] is False
    assert state["trial"]["active"] is False

def test_start_trial_flow_monthly_and_yearly(db_session: Session):
    """
    Verify zero-trial setup for monthly (₹900) and yearly (₹4,999).
    With zero trial days, subscription evaluates to EXPIRED upfront requiring active payment,
    and when a trial period is simulated in the past, evaluate_subscription_state marks status EXPIRED.
    """
    biz_m = Business(id="biz-sub-m", name="Monthly Biz", email="m@test.com", classification="Retail")
    biz_y = Business(id="biz-sub-y", name="Yearly Biz", email="y@test.com", classification="Retail")
    db_session.add_all([biz_m, biz_y])
    db_session.commit()

    # Monthly Zero-Trial Start
    state_m = EntitlementService.start_trial(db_session, "biz-sub-m", "monthly")
    assert state_m["status"] == "EXPIRED"
    assert state_m["pricing"]["billing_interval"] == "monthly"
    assert state_m["pricing"]["price"] == 900.0
    assert state_m["trial"]["days_remaining"] == 0

    # Yearly Zero-Trial Start
    state_y = EntitlementService.start_trial(db_session, "biz-sub-y", "yearly")
    assert state_y["status"] == "EXPIRED"
    assert state_y["pricing"]["billing_interval"] == "yearly"
    assert state_y["pricing"]["price"] == 4999.0
    assert state_y["trial"]["days_remaining"] == 0

    # Expiry Simulation on an active trial window
    sub_m = db_session.query(Subscription).filter(Subscription.business_id == "biz-sub-m").first()
    sub_m.status = "TRIAL_ACTIVE"
    sub_m.trial_ends_at = datetime.utcnow() - timedelta(hours=1)
    db_session.commit()

    state_expired = EntitlementService.evaluate_subscription_state(db_session, "biz-sub-m")
    assert state_expired["status"] == "EXPIRED"
    assert state_expired["is_live_accessible"] is False
    assert state_expired["is_paid"] is False

def test_tenant_subscription_isolation_and_idor(client: TestClient, auth_headers_a, auth_headers_b):
    """
    Verify Business A cannot access or modify Business B's subscription status.
    """
    res_a = client.get("/api/v1/subscriptions/status", headers=auth_headers_a)
    assert res_a.status_code == 200
    res_b = client.get("/api/v1/subscriptions/status", headers=auth_headers_b)
    assert res_b.status_code == 200

    assert res_a.json()["business_id"] != res_b.json()["business_id"]

def test_subscription_plans_endpoint(client: TestClient, auth_headers_a):
    """
    Verify /subscriptions/plans returns Autofy Pro Monthly and Yearly plan definitions.
    """
    res = client.get("/api/v1/subscriptions/plans", headers=auth_headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "plans" in data
    assert "monthly" in data["plans"]
    assert "yearly" in data["plans"]
    assert data["plans"]["monthly"]["price"] == 900.0
    assert data["plans"]["yearly"]["price"] == 4999.0
    assert data["plans"]["monthly"]["razorpay_plan_id"] == "plan_TZx4AbrrftCAcm"
    assert data["plans"]["yearly"]["razorpay_plan_id"] == "plan_TZxFTBI4TK3IAY"
    assert data["plans"]["monthly"]["trial_days"] == 0
    assert data["plans"]["yearly"]["trial_days"] == 0

def test_autofy_pro_entitlements(db_session: Session):
    """
    Verify EntitlementService returns full Autofy Pro entitlements.
    """
    biz = Business(id="biz-ent-pro", name="Pro Biz", email="pro@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    EntitlementService.start_trial(db_session, "biz-ent-pro", "monthly")
    state = EntitlementService.evaluate_subscription_state(db_session, "biz-ent-pro")

    assert state["entitlements"]["custom_rag"] is True
    assert state["entitlements"]["appointments_booking"] is True
    assert state["entitlements"]["whatsapp_auto_reply"] is True

def test_razorpay_subscription_zero_trial_and_plan_ids():
    """
    Verify RazorpaySubscriptionService:
    1. Resolves plan_TZx4AbrrftCAcm for monthly (₹900)
    2. Resolves plan_TZxFTBI4TK3IAY for yearly (₹4,999)
    3. Sends NO start_at timestamp (zero trial delay, immediate activation)
    4. Auto-corrects typo plan IDs via PLAN_ID_ALIASES
    5. Rejects deprecated old plan IDs
    """
    from services.razorpay_subscription_service import (
        RazorpaySubscriptionService,
        RazorpaySubscriptionConfigurationError
    )

    # Test monthly creation
    sub_m = RazorpaySubscriptionService.create_subscription("biz-test-m", "monthly")
    assert sub_m["razorpay_plan_id"] == "plan_TZx4AbrrftCAcm"
    assert sub_m["start_at"] is None

    # Test yearly creation
    sub_y = RazorpaySubscriptionService.create_subscription("biz-test-y", "yearly")
    assert sub_y["razorpay_plan_id"] == "plan_TZxFTBI4TK3IAY"
    assert sub_y["start_at"] is None

    # Test alias resolution for transposed typo ("A4" -> "4A")
    os.environ["RAZORPAY_MONTHLY_PLAN_ID"] = "plan_TZxA4BrrftCAcm"
    assert RazorpaySubscriptionService.get_configured_plan_id("monthly") == "plan_TZx4AbrrftCAcm"

    # Test alias resolution for visual confusion typo (digit "1" -> uppercase "I")
    os.environ["RAZORPAY_YEARLY_PLAN_ID"] = "plan_TZxFTBI4TK31AY"
    assert RazorpaySubscriptionService.get_configured_plan_id("yearly") == "plan_TZxFTBI4TK3IAY"

    # Test rejection of deprecated plan IDs
    os.environ["RAZORPAY_MONTHLY_PLAN_ID"] = "plan_TNgiEyXlTAKiM9"
    with pytest.raises(RazorpaySubscriptionConfigurationError):
        RazorpaySubscriptionService.get_configured_plan_id("monthly")

    # Restore
    os.environ["RAZORPAY_MONTHLY_PLAN_ID"] = "plan_TZx4AbrrftCAcm"
    os.environ["RAZORPAY_YEARLY_PLAN_ID"] = "plan_TZxFTBI4TK3IAY"

def test_create_subscription_checkout_endpoint_zero_trial(client: TestClient, auth_headers_a):
    """
    Verify POST /subscriptions/create-checkout produces zero-trial, immediate billing payloads:
    - Monthly: ₹900 charged today, 0 trial days, plan_TZx4AbrrftCAcm
    - Yearly: ₹4,999 charged today, 0 trial days, plan_TZxFTBI4TK3IAY
    """
    # 1. Monthly Checkout
    res_m = client.post("/api/v1/subscriptions/create-checkout", json={"billing_interval": "monthly"}, headers=auth_headers_a)
    assert res_m.status_code == 200
    data_m = res_m.json()
    assert data_m["billing_interval"] == "monthly"
    assert data_m["charge_amount"] == 900.0
    assert data_m["normal_recurring_price"] == 900.0
    assert data_m["trial_days"] == 0
    assert data_m["razorpay_plan_id"] == "plan_TZx4AbrrftCAcm"
    assert data_m["disclosures"]["amount_today"] == 900.0
    assert data_m["disclosures"]["trial_days"] == 0
    assert data_m["disclosures"]["recurring_amount"] == 900.0

    # 2. Yearly Checkout
    res_y = client.post("/api/v1/subscriptions/create-checkout", json={"billing_interval": "yearly"}, headers=auth_headers_a)
    assert res_y.status_code == 200
    data_y = res_y.json()
    assert data_y["billing_interval"] == "yearly"
    assert data_y["charge_amount"] == 4999.0
    assert data_y["normal_recurring_price"] == 4999.0
    assert data_y["trial_days"] == 0
    assert data_y["razorpay_plan_id"] == "plan_TZxFTBI4TK3IAY"
    assert data_y["disclosures"]["amount_today"] == 4999.0
    assert data_y["disclosures"]["trial_days"] == 0
    assert data_y["disclosures"]["recurring_amount"] == 4999.0

@pytest.mark.asyncio
async def test_webhook_subscription_authenticated_activates_immediately(db_session: Session):
    """
    Verify Razorpay webhook subscription.authenticated activates subscription immediately
    with status ACTIVE and full period without entering a 7-day trial.
    """
    from services.payment_services import RazorpayService
    from models.subscription import Subscription

    biz = Business(id="biz-auth-test", name="Webhook Biz", email="hook@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    sub = EntitlementService.get_or_create_subscription(db_session, "biz-auth-test")
    sub.status = "EXPLORING"
    sub.billing_interval = "yearly"
    db_session.commit()

    webhook_payload = {
        "event": "subscription.authenticated",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_rzp_live_test_123",
                    "notes": {"business_id": "biz-auth-test"}
                }
            }
        }
    }

    result = await RazorpayService.process_webhook_callback(db_session, webhook_payload)
    assert result["status"] == "success"
    assert result["action"] == "subscription_authenticated"

    refreshed_sub = db_session.query(Subscription).filter(Subscription.business_id == "biz-auth-test").first()
    assert refreshed_sub.status == "ACTIVE"
    assert refreshed_sub.provider_subscription_id == "sub_rzp_live_test_123"
    assert (refreshed_sub.current_period_end - datetime.utcnow()).days >= 364
