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
