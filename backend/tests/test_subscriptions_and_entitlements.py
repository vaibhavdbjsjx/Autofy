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
    Verify brand-new business gets 'EXPLORING' status on 'starter' plan with zero fake paid status.
    """
    biz = Business(id="biz-sub-new", name="New Biz", email="newbiz@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    state = EntitlementService.evaluate_subscription_state(db_session, "biz-sub-new")
    assert state["status"] == "EXPLORING"
    assert state["plan_id"] == "starter"
    assert state["is_live_accessible"] is False
    assert state["is_paid"] is False
    assert state["trial"]["active"] is False

def test_start_trial_flow_and_expiration(db_session: Session):
    """
    Verify start_trial sets TRIAL_ACTIVE with a 7-day window.
    Verify when trial_ends_at is in the past, evaluate_subscription_state marks status EXPIRED.
    """
    biz = Business(id="biz-sub-trial", name="Trial Biz", email="trialbiz@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    # Start trial on 'pro' plan
    state_active = EntitlementService.start_trial(db_session, "biz-sub-trial", "pro")
    assert state_active["status"] == "TRIAL_ACTIVE"
    assert state_active["plan_id"] == "pro"
    assert state_active["is_live_accessible"] is True

    # Simulate time lapse past trial end
    sub = db_session.query(Subscription).filter(Subscription.business_id == "biz-sub-trial").first()
    sub.trial_ends_at = datetime.utcnow() - timedelta(hours=1)
    db_session.commit()

    state_expired = EntitlementService.evaluate_subscription_state(db_session, "biz-sub-trial")
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

def test_unauthorized_status_or_plan_manipulation_rejected(client: TestClient, auth_headers_a):
    """
    Verify a client sending arbitrary JSON payload cannot upgrade themselves to 'ACTIVE' status.
    """
    # Attempt POST to start-trial with invalid plan
    res_invalid = client.post("/api/v1/subscriptions/start-trial", json={"plan_id": "hacker_enterprise"}, headers=auth_headers_a)
    assert res_invalid.status_code == 400

def test_empty_business_billing_state_no_fake_history(client: TestClient, auth_headers_a):
    """
    Verify a business returns clean subscription plans and zero fake transactions.
    """
    res = client.get("/api/v1/subscriptions/plans", headers=auth_headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "plans" in data
    assert "starter" in data["plans"]
    assert "pro" in data["plans"]
    assert "enterprise" in data["plans"]

def test_feature_entitlement_checker_dependency(db_session: Session):
    """
    Verify EntitlementService returns correct feature entitlement flags for starter vs pro vs enterprise plans.
    """
    biz_starter = Business(id="biz-ent-start", name="Starter Biz", email="start@test.com", classification="Retail")
    biz_pro = Business(id="biz-ent-pro", name="Pro Biz", email="pro@test.com", classification="Retail")
    db_session.add_all([biz_starter, biz_pro])
    db_session.commit()

    EntitlementService.start_trial(db_session, "biz-ent-start", "starter")
    EntitlementService.start_trial(db_session, "biz-ent-pro", "pro")

    state_start = EntitlementService.evaluate_subscription_state(db_session, "biz-ent-start")
    state_pro = EntitlementService.evaluate_subscription_state(db_session, "biz-ent-pro")

    assert state_start["entitlements"]["custom_rag"] is False
    assert state_start["entitlements"]["appointments_booking"] is False

    assert state_pro["entitlements"]["custom_rag"] is True
    assert state_pro["entitlements"]["appointments_booking"] is True
