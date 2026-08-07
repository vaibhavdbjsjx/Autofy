import pytest
from fastapi.testclient import TestClient

def test_health_check_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database_connected" in data

def test_user_authentication_success(client: TestClient, test_user_a):
    response = client.post("/api/v1/auth/login", json={
        "email": "owner_a@alphaauto.com",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_user_authentication_invalid_password(client: TestClient, test_user_a):
    response = client.post("/api/v1/auth/login", json={
        "email": "owner_a@alphaauto.com",
        "password": "WrongPassword!"
    })
    assert response.status_code in [400, 401]

def test_tenant_isolation_leads(client: TestClient, auth_headers_a, auth_headers_b):
    # User A creates a lead
    create_res_a = client.post("/api/v1/leads", json={
        "name": "Customer Alpha",
        "phone": "+919999911111",
        "email": "cust_a@gmail.com",
        "source": "Website"
    }, headers=auth_headers_a)
    assert create_res_a.status_code == 201
    lead_a_id = create_res_a.json()["id"]

    # User A lists leads -> sees Lead Alpha
    list_res_a = client.get("/api/v1/leads", headers=auth_headers_a)
    assert list_res_a.status_code == 200
    ids_a = [l["id"] for l in list_res_a.json().get("items", [])]
    assert lead_a_id in ids_a

    # User B lists leads -> CANNOT see Lead Alpha
    list_res_b = client.get("/api/v1/leads", headers=auth_headers_b)
    assert list_res_b.status_code == 200
    ids_b = [l["id"] for l in list_res_b.json().get("items", [])]
    assert lead_a_id not in ids_b

    # User B tries to fetch Lead Alpha directly -> 404
    direct_res_b = client.get(f"/api/v1/leads/{lead_a_id}", headers=auth_headers_b)
    assert direct_res_b.status_code == 404

def test_google_oauth_user_creation_and_isolation(client: TestClient, monkeypatch):
    from auth.google_oauth import GoogleUserSchema
    
    # Mock Google OAuth token exchange for Account A
    async def mock_google_a(code: str):
        if code == "code_a":
            return GoogleUserSchema(
                email="google_user_a@gmail.com",
                name="Google User A",
                picture="https://google.com/avatar_a.png",
                sub="google_sub_111"
            )
        else:
            return GoogleUserSchema(
                email="google_user_b@gmail.com",
                name="Google User B",
                picture="https://google.com/avatar_b.png",
                sub="google_sub_222"
            )

    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_google_a)

    # 1. Callback for Google Account A
    res_a = client.get("/api/v1/auth/google/callback?code=code_a", follow_redirects=False)
    assert res_a.status_code == 307
    location_a = res_a.headers["location"]
    assert "access_token=" in location_a
    assert "is_onboarded=false" in location_a

    # Extract Token A
    from urllib.parse import parse_qs, urlparse
    parsed_a = parse_qs(urlparse(location_a).fragment)
    token_a = parsed_a["access_token"][0]

    # 2. Callback for Google Account B
    res_b = client.get("/api/v1/auth/google/callback?code=code_b", follow_redirects=False)
    assert res_b.status_code == 307
    location_b = res_b.headers["location"]
    assert "access_token=" in location_b
    assert "is_onboarded=false" in location_b

    parsed_b = parse_qs(urlparse(location_b).fragment)
    token_b = parsed_b["access_token"][0]
    assert token_a != token_b

    # 3. Verify Profile Isolation via /api/v1/auth/me
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    me_a = client.get("/api/v1/auth/me", headers=headers_a).json()
    me_b = client.get("/api/v1/auth/me", headers=headers_b).json()

    assert me_a["email"] == "google_user_a@gmail.com"
    assert me_a["name"] == "Google User A"
    assert me_a["is_onboarded"] is False

    assert me_b["email"] == "google_user_b@gmail.com"
    assert me_b["name"] == "Google User B"
    assert me_b["is_onboarded"] is False

    assert me_a["user_id"] != me_b["user_id"]
    assert me_a["business"]["id"] != me_b["business"]["id"]

def test_onboarding_completion_flow(client: TestClient, monkeypatch):
    from auth.google_oauth import GoogleUserSchema
    async def mock_google(code: str):
        return GoogleUserSchema(
            email="new_onboarding_user@gmail.com",
            name="New Owner",
            picture=None,
            sub="sub_onboard_999"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_google)

    res = client.get("/api/v1/auth/google/callback?code=code_onboard", follow_redirects=False)
    from urllib.parse import parse_qs, urlparse
    parsed = parse_qs(urlparse(res.headers["location"]).fragment)
    token = parsed["access_token"][0]
    headers = {"Authorization": f"Bearer {token}"}

    # Before onboarding
    me_before = client.get("/api/v1/auth/me", headers=headers).json()
    assert me_before["is_onboarded"] is False

    # Complete Onboarding
    complete_res = client.post("/api/v1/business/complete-onboarding", json={
        "name": "Apex Fitness Hub",
        "classification": "Gym & Fitness",
        "phone": "+919876543210"
    }, headers=headers)
    assert complete_res.status_code == 200
    assert complete_res.json()["is_onboarded"] is True

    # After onboarding
    me_after = client.get("/api/v1/auth/me", headers=headers).json()
    assert me_after["is_onboarded"] is True
    assert me_after["business"]["name"] == "Apex Fitness Hub"
    assert me_after["business"]["phone"] == "+919876543210"

def test_onboarding_backend_validation_rejection(client: TestClient, monkeypatch):
    from auth.google_oauth import GoogleUserSchema
    async def mock_google(code: str):
        return GoogleUserSchema(
            email="invalid_onboarding_user@gmail.com",
            name="Invalid User",
            picture=None,
            sub="sub_invalid_111"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_google)

    res = client.get("/api/v1/auth/google/callback?code=code_invalid", follow_redirects=False)
    from urllib.parse import parse_qs, urlparse
    parsed = parse_qs(urlparse(res.headers["location"]).fragment)
    token = parsed["access_token"][0]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to complete onboarding with invalid/empty fields
    invalid_res = client.post("/api/v1/business/complete-onboarding", json={
        "name": "a",
        "classification": "",
        "phone": "12"
    }, headers=headers)
    assert invalid_res.status_code == 422

    # Verify is_onboarded remains False
    me_check = client.get("/api/v1/auth/me", headers=headers).json()
    assert me_check["is_onboarded"] is False

def test_email_collision_handling(client: TestClient, monkeypatch):
    from auth.google_oauth import GoogleUserSchema

    # 1. Register user via Email/Password
    signup_res = client.post("/api/v1/auth/signup", json={
        "name": "Collision User",
        "business_name": "Collision Fitness",
        "email": "shared_identity@gmail.com",
        "password": "Password123!"
    })
    assert signup_res.status_code == 201

    # 2. Attempt duplicate signup with same email -> 409 Conflict
    dup_signup = client.post("/api/v1/auth/signup", json={
        "name": "Duplicate User",
        "business_name": "Duplicate Business",
        "email": "shared_identity@gmail.com",
        "password": "Password123!"
    })
    assert dup_signup.status_code == 409

    # 3. Authenticate with Google using same email -> Resolves to existing account safely
    async def mock_google_collision(code: str):
        return GoogleUserSchema(
            email="shared_identity@gmail.com",
            name="Collision User",
            picture="https://google.com/avatar.png",
            sub="sub_shared_888"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_google_collision)

    sso_res = client.get("/api/v1/auth/google/callback?code=code_shared", follow_redirects=False)
    assert sso_res.status_code == 307
    from urllib.parse import parse_qs, urlparse
    parsed = parse_qs(urlparse(sso_res.headers["location"]).fragment)
    token = parsed["access_token"][0]

    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers).json()
    assert me_res["email"] == "shared_identity@gmail.com"
    assert me_res["name"] == "Collision User"
