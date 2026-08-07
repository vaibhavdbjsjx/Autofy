import pytest
from fastapi.testclient import TestClient

def test_api_contract_auth_and_onboarding(client: TestClient, test_business_a, test_user_a, auth_headers_a):
    """
    Verify API contract for /auth/me, business profile, and onboarding completion.
    """
    # GET /auth/me
    res_me = client.get("/api/v1/auth/me", headers=auth_headers_a)
    assert res_me.status_code == 200
    data_me = res_me.json()
    assert "user_id" in data_me
    assert "email" in data_me
    assert "business" in data_me

    # GET /business/profile and /business/me
    res_biz = client.get("/api/v1/business/profile", headers=auth_headers_a)
    assert res_biz.status_code == 200
    res_biz_alias = client.get("/api/v1/business/me", headers=auth_headers_a)
    assert res_biz_alias.status_code == 200

    # POST /business/complete-onboarding
    onboard_payload = {
        "name": "Contract Test Business",
        "classification": "Automotive",
        "phone": "+91 99887 76655",
        "website": "https://contract-test.com",
        "address": "123 Innovation Drive"
    }
    res_onboard = client.post("/api/v1/business/complete-onboarding", json=onboard_payload, headers=auth_headers_a)
    assert res_onboard.status_code == 200, f"Got {res_onboard.status_code}: {res_onboard.text}"
    assert res_onboard.json()["is_onboarded"] is True

def test_api_contract_dashboard_and_leads(client: TestClient, test_business_a, test_user_a, auth_headers_a):
    """
    Verify API contract for Dashboard summary and Leads CRUD operations.
    """
    # GET /business/dashboard-summary
    res_summary = client.get("/api/v1/business/dashboard-summary", headers=auth_headers_a)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["mode"] == "live"
    assert "metrics" in summary
    assert "active_leads" in summary["metrics"]

    # POST /leads
    lead_payload = {
        "name": "Contract Lead",
        "email": "lead.contract@test.com",
        "phone": "+91 91234 56789",
        "status": "New",
        "source": "Web"
    }
    res_create = client.post("/api/v1/leads", json=lead_payload, headers=auth_headers_a)
    assert res_create.status_code == 201
    lead_id = res_create.json()["id"]

    # GET /leads
    res_list = client.get("/api/v1/leads", headers=auth_headers_a)
    assert res_list.status_code == 200
    assert "items" in res_list.json()

    # PUT and PATCH /leads/{id}
    res_put = client.put(f"/api/v1/leads/{lead_id}", json={"status": "Contacted"}, headers=auth_headers_a)
    assert res_put.status_code == 200
    res_patch = client.patch(f"/api/v1/leads/{lead_id}", json={"status": "Qualified"}, headers=auth_headers_a)
    assert res_patch.status_code == 200

    # DELETE /leads/{id}
    res_del = client.delete(f"/api/v1/leads/{lead_id}", headers=auth_headers_a)
    assert res_del.status_code == 204

def test_api_contract_appointments_and_crm(client: TestClient, test_business_a, test_user_a, auth_headers_a):
    """
    Verify API contract for Appointments and CRM profile updates.
    """
    # POST /appointments
    appt_payload = {
        "customer_name": "Contract Client",
        "customer_phone": "+91 98765 43210",
        "appointment_date": "2026-08-08T10:00:00",
        "start_time": "10:00 AM",
        "end_time": "11:00 AM",
        "notes": "Consultation"
    }
    res_appt = client.post("/api/v1/appointments", json=appt_payload, headers=auth_headers_a)
    assert res_appt.status_code == 201
    appt_id = res_appt.json()["id"]

    # PATCH /appointments/{id}/cancel
    res_cancel = client.patch(f"/api/v1/appointments/{appt_id}/cancel", json={"status": "Cancelled"}, headers=auth_headers_a)
    assert res_cancel.status_code == 200

    # GET /crm/profiles
    res_crm = client.get("/api/v1/crm/profiles", headers=auth_headers_a)
    assert res_crm.status_code == 200

def test_api_contract_products_and_orders(client: TestClient, test_business_a, test_user_a, auth_headers_a):
    """
    Verify API contract for Products and Orders.
    """
    # POST /products
    prod_payload = {
        "name": "Contract Product",
        "category": "Exhaust",
        "price": 1500.0,
        "stock": 10,
        "business_id": "foreign-business-id"
    }
    res_prod = client.post("/api/v1/products", json=prod_payload, headers=auth_headers_a)
    assert res_prod.status_code == 201
    prod_data = res_prod.json()
    prod_id = prod_data["id"]
    assert prod_data["business_id"] == test_business_a.id

    # POST /orders
    order_payload = {
        "customer_name": "Buyer Contract",
        "customer_email": "buyer.contract@test.com",
        "shipping_address": "123 Contract Street",
        "customer_phone": "+91 90000 11111",
        "items_json": f'[{{\"product_id\": \"{prod_id}\", \"quantity\": 1, \"price\": 1500.0}}]',
        "total_price": 1.0,
        "business_id": "foreign-business-id"
    }
    res_order = client.post("/api/v1/orders", json=order_payload, headers=auth_headers_a)
    assert res_order.status_code == 201
    order_data = res_order.json()
    order_id = order_data["id"]
    assert order_data["business_id"] == test_business_a.id
    assert float(order_data["total_price"]) == 1500.0

    # PATCH /orders/{id}/status
    res_status = client.patch(f"/api/v1/orders/{order_id}/status", json={"status": "Shipped"}, headers=auth_headers_a)
    assert res_status.status_code == 200

def test_api_contract_team_and_subscriptions(client: TestClient, test_business_a, test_user_a, auth_headers_a):
    """
    Verify API contract for Team management and Subscriptions.
    """
    # GET /team and GET /team/members
    res_team1 = client.get("/api/v1/team", headers=auth_headers_a)
    assert res_team1.status_code == 200
    res_team2 = client.get("/api/v1/team/members", headers=auth_headers_a)
    assert res_team2.status_code == 200

    # GET /subscriptions/status
    res_sub = client.get("/api/v1/subscriptions/status", headers=auth_headers_a)
    assert res_sub.status_code == 200
    assert "status" in res_sub.json()
