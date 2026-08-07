import pytest
from fastapi.testclient import TestClient

def test_business_profile_get_and_update(client: TestClient, auth_headers_a):
    # GET profile
    get_res = client.get("/api/v1/business/profile", headers=auth_headers_a)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Alpha Auto Garage"

    # PUT profile update
    put_res = client.put("/api/v1/business/profile", json={
        "name": "Alpha Auto Pro",
        "description": "Updated garage description."
    }, headers=auth_headers_a)
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "Alpha Auto Pro"

def test_dashboard_summary_live_vs_demo(client: TestClient, auth_headers_a):
    # Live mode by default
    live_res = client.get("/api/v1/business/dashboard-summary", headers=auth_headers_a)
    assert live_res.status_code == 200
    assert live_res.json()["mode"] == "live"

    # Explicit Demo mode parameter
    demo_res = client.get("/api/v1/business/dashboard-summary?demo=true", headers=auth_headers_a)
    assert demo_res.status_code == 200
    assert demo_res.json()["mode"] == "demo"

def test_account_deletion_flow(client: TestClient, auth_headers_b, test_user_b):
    # Execute account deletion with password verification
    delete_res = client.request("DELETE", "/api/v1/auth/delete-account", json={
        "password": "Password123!",
        "confirmation_text": "DELETE"
    }, headers=auth_headers_b)
    assert delete_res.status_code == 200
    data = delete_res.json()
    assert data.get("status") in ["deleted", "success"]

    # Subsequent request with token fails or returns 401
    verify_res = client.get("/api/v1/business/profile", headers=auth_headers_b)
    assert verify_res.status_code in [401, 404]

def test_onboarding_completion_persistence_and_phone_normalization(client: TestClient, auth_headers_a):
    # 1. Complete onboarding with Indian 10-digit number (e.g. 6360254763)
    res = client.post("/api/v1/business/complete-onboarding", json={
        "name": "Apex Fitness Hub",
        "classification": "Gym",
        "phone": "6360254763",
        "address": "Bangalore, India"
    }, headers=auth_headers_a)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Apex Fitness Hub"
    assert data["classification"] == "Gym"
    assert data["phone"] == "+916360254763"
    assert data["is_onboarded"] is True

    # 2. Verify persistence via GET /auth/me
    me_res = client.get("/api/v1/auth/me", headers=auth_headers_a)
    assert me_res.status_code == 200
    assert me_res.json()["is_onboarded"] is True

def test_onboarding_phone_normalization_edge_cases(client: TestClient, auth_headers_a):
    # Test 0-prefix Indian number: 06360254763 -> +916360254763
    res1 = client.post("/api/v1/business/complete-onboarding", json={
        "name": "Apex Fitness Hub",
        "classification": "Gym",
        "phone": "06360254763"
    }, headers=auth_headers_a)
    assert res1.status_code == 200
    assert res1.json()["phone"] == "+916360254763"

    # Test double prefix: +91916360254763 -> +916360254763
    res2 = client.post("/api/v1/business/complete-onboarding", json={
        "name": "Apex Fitness Hub",
        "classification": "Gym",
        "phone": "+91916360254763"
    }, headers=auth_headers_a)
    assert res2.status_code == 200
    assert res2.json()["phone"] == "+916360254763"

def test_onboarding_invalid_phone_rejection(client: TestClient, auth_headers_a):
    # Test invalid string phone "abc"
    res1 = client.post("/api/v1/business/complete-onboarding", json={
        "name": "Apex Fitness Hub",
        "classification": "Gym",
        "phone": "abc"
    }, headers=auth_headers_a)
    assert res1.status_code == 422

    # Test too short phone "123"
    res2 = client.post("/api/v1/business/complete-onboarding", json={
        "name": "Apex Fitness Hub",
        "classification": "Gym",
        "phone": "123"
    }, headers=auth_headers_a)
    assert res2.status_code == 422
