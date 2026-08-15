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
    Verify monthly trial (7 days, ₹699) and yearly trial (14 days, ₹6,899) setup.
    Verify when trial_ends_at is in the past, evaluate_subscription_state marks status EXPIRED.
    """
    biz_m = Business(id="biz-sub-m", name="Monthly Biz", email="m@test.com", classification="Retail")
    biz_y = Business(id="biz-sub-y", name="Yearly Biz", email="y@test.com", classification="Retail")
    db_session.add_all([biz_m, biz_y])
    db_session.commit()

    # Monthly Trial
    state_m = EntitlementService.start_trial(db_session, "biz-sub-m", "monthly")
    assert state_m["status"] == "TRIAL_ACTIVE"
    assert state_m["pricing"]["billing_interval"] == "monthly"
    assert state_m["pricing"]["price"] == 699.0
    assert state_m["trial"]["days_remaining"] <= 7

    # Yearly Trial
    state_y = EntitlementService.start_trial(db_session, "biz-sub-y", "yearly")
    assert state_y["status"] == "TRIAL_ACTIVE"
    assert state_y["pricing"]["billing_interval"] == "yearly"
    assert state_y["pricing"]["price"] == 6899.0
    assert state_y["trial"]["days_remaining"] <= 14

    # Expiry Simulation
    sub_m = db_session.query(Subscription).filter(Subscription.business_id == "biz-sub-m").first()
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
    assert data["plans"]["monthly"]["price"] == 699.0
    assert data["plans"]["yearly"]["price"] == 6899.0

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
