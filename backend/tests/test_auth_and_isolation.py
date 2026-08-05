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
