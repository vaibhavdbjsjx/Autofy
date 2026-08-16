import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.lead import Lead
from models.conversation import Conversation
from models.message import Message
from services.lead_services import LeadCRUD, normalize_phone

def test_whatsapp_creates_lead_and_conversation(client: TestClient, db_session: Session, monkeypatch):
    """
    Verify inbound WhatsApp message creates a Lead, Conversation, and persists Message.
    """
    biz = Business(
        id="biz-crm-1",
        name="Auto Care 1",
        email="crm1@auto.com",
        classification="Automotive",
        whatsapp_phone_id="phone_id_crm_1"
    )
    db_session.add(biz)
    db_session.commit()

    async def mock_send(*args, **kwargs):
        return {"messaging_product": "whatsapp", "messages": [{"id": "wamid.mock_crm_1"}]}
    monkeypatch.setattr("services.whatsapp_services.WhatsAppService.send_whatsapp_message", mock_send)

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "waba_crm_1",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "phone_id_crm_1"},
                    "contacts": [{"profile": {"name": "CRM Customer"}, "wa_id": "919876543210"}],
                    "messages": [{
                        "from": "919876543210",
                        "id": "wamid.crm_test_100",
                        "type": "text",
                        "text": {"body": "Looking for service quote"}
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    res = client.post("/api/v1/whatsapp/webhook", json=payload)
    assert res.status_code == 200

    # Verify lead created
    lead = db_session.query(Lead).filter(Lead.business_id == "biz-crm-1", Lead.phone == "919876543210").first()
    assert lead is not None
    assert lead.name == "CRM Customer"

    # Verify conversation created
    conv = db_session.query(Conversation).filter(Conversation.business_id == "biz-crm-1", Conversation.lead_id == lead.id).first()
    assert conv is not None

def test_phone_normalization_deduplication(db_session: Session):
    """
    Verify phone normalization matches +919876543210, 919876543210, and 9876543210 to same lead.
    """
    biz = Business(id="biz-crm-norm", name="Norm Auto", email="norm@auto.com", classification="Automotive")
    db_session.add(biz)
    db_session.commit()

    lead = Lead(business_id="biz-crm-norm", name="Norm User", phone="+919876543210")
    db_session.add(lead)
    db_session.commit()

    # Query using un-formatted variation
    found1 = LeadCRUD.get_by_phone(db_session, "biz-crm-norm", "919876543210")
    assert found1 is not None
    assert found1.id == lead.id

    assert normalize_phone("+91-98765-43210") == "919876543210"

def test_same_phone_across_businesses_isolated(db_session: Session):
    """
    Verify same phone number contacting Business A and Business B creates 2 separate tenant leads.
    """
    biz_a = Business(id="biz-tenant-a", name="Tenant A", email="ta@test.com", classification="Automotive")
    biz_b = Business(id="biz-tenant-b", name="Tenant B", email="tb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    lead_a = Lead(business_id="biz-tenant-a", name="Shared Phone User A", phone="919999999999")
    lead_b = Lead(business_id="biz-tenant-b", name="Shared Phone User B", phone="919999999999")
    db_session.add_all([lead_a, lead_b])
    db_session.commit()

    found_a = LeadCRUD.get_by_phone(db_session, "biz-tenant-a", "919999999999")
    found_b = LeadCRUD.get_by_phone(db_session, "biz-tenant-b", "919999999999")

    assert found_a.id != found_b.id
    assert found_a.business_id == "biz-tenant-a"
    assert found_b.business_id == "biz-tenant-b"

def test_lead_crud_tenant_isolation(db_session: Session):
    """
    Verify LeadCRUD.get_by_id returns None for foreign business lead.
    """
    biz_a = Business(id="biz-iso-a", name="Iso A", email="isoa@test.com", classification="Automotive")
    biz_b = Business(id="biz-iso-b", name="Iso B", email="isob@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    lead_a = Lead(id="lead-a-123", business_id="biz-iso-a", name="Lead A", phone="918888888888")
    db_session.add(lead_a)
    db_session.commit()

    # Business B attempts to retrieve Lead A
    foreign = LeadCRUD.get_by_id(db_session, "biz-iso-b", "lead-a-123")
    assert foreign is None

def test_empty_business_crm_and_leads_zero_data(db_session: Session):
    """
    Verify a new business with zero records returns empty lists and 0 counts.
    """
    biz_empty = Business(id="biz-empty-1", name="Empty Startup", email="empty@startup.com", classification="Automotive")
    db_session.add(biz_empty)
    db_session.commit()

    leads, count = LeadCRUD.list_paginated(db_session, "biz-empty-1")
    assert count == 0
    assert len(leads) == 0


def test_crm_pipeline_stages_and_conversion_tracking(client: TestClient, auth_headers_a: dict, test_business_a: Business, db_session: Session):
    # 1. Create a lead with deal value
    create_res = client.post("/api/v1/leads", json={
        "name": "Sarah Jenkins",
        "email": "sarah@fitnesspro.com",
        "phone": "+91 98765 11223",
        "pipeline_stage": "New",
        "deal_value": 4999,
        "tags": "VIP,Hot-Lead",
        "notes": "Looking for 1-year annual fitness membership"
    }, headers=auth_headers_a)
    assert create_res.status_code == 201
    lead_id = create_res.json()["id"]

    # 2. Check pipeline summary
    pipe_res = client.get("/api/v1/leads/pipeline", headers=auth_headers_a)
    assert pipe_res.status_code == 200
    pipe_data = pipe_res.json()
    assert pipe_data["summary"]["total_leads"] >= 1
    assert any(s["stage"] == "New" and s["count"] >= 1 for s in pipe_data["stages"])

    # 3. Transition stage to 'Qualified' then 'Won'
    patch_stage_res = client.patch(f"/api/v1/leads/{lead_id}/stage?stage=Won", headers=auth_headers_a)
    assert patch_stage_res.status_code == 200
    assert patch_stage_res.json()["pipeline_stage"] == "Won"
    assert patch_stage_res.json()["status"] == "Converted"

    # 4. Assign lead to team member
    assign_res = client.patch(f"/api/v1/leads/{lead_id}/assign?user_id=user-agent-1&user_name=Coach+David", headers=auth_headers_a)
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_to_name"] == "Coach David"

    # 5. Schedule follow-up
    follow_res = client.patch(f"/api/v1/leads/{lead_id}/follow-up?follow_up_at=2026-09-01T10:00:00&notes=Send+welcome+kit", headers=auth_headers_a)
    assert follow_res.status_code == 200
    assert "2026-09-01" in follow_res.json()["follow_up_at"]

    # 6. Test CSV Export for Leads and Customers
    leads_csv = client.get("/api/v1/leads/export", headers=auth_headers_a)
    assert leads_csv.status_code == 200
    assert "Lead ID,Name,Email,Phone" in leads_csv.text
    assert "Sarah Jenkins" in leads_csv.text

    cust_csv = client.get("/api/v1/crm/export", headers=auth_headers_a)
    assert cust_csv.status_code == 200
    assert "Profile ID,Name,Email,Phone" in cust_csv.text


def test_enterprise_team_rbac_and_activity_logging(client: TestClient, auth_headers_a: dict, test_business_a: Business, db_session: Session):
    # 1. Check my permissions
    my_perm_res = client.get("/api/v1/team/permissions/me", headers=auth_headers_a)
    assert my_perm_res.status_code == 200
    assert my_perm_res.json()["role"] == "Owner"
    assert my_perm_res.json()["permissions"]["can_edit_pricing"] is True

    # 2. Check full role matrix
    matrix_res = client.get("/api/v1/team/permissions/matrix", headers=auth_headers_a)
    assert matrix_res.status_code == 200
    assert "Support Agent" in matrix_res.json()["matrix"]
    assert matrix_res.json()["matrix"]["Accountant"]["can_manage_payments"] is True
    assert matrix_res.json()["matrix"]["Support Agent"]["can_edit_pricing"] is False

    # 3. Invite new team member
    invite_res = client.post("/api/v1/team/invite", json={
        "name": "Alex Accountant",
        "email": "alex@accounts.com",
        "role": "Accountant"
    }, headers=auth_headers_a)
    assert invite_res.status_code == 201
    member_id = invite_res.json()["id"]

    # 4. Check Activity Log recorded the event
    act_res = client.get("/api/v1/team/activity-logs", headers=auth_headers_a)
    assert act_res.status_code == 200
    logs = act_res.json()
    assert len(logs) >= 1
    assert any("TEAM_MEMBER_INVITED" in l["action"] for l in logs)

    # 5. Revoke team member
    del_res = client.delete(f"/api/v1/team/members/{member_id}", headers=auth_headers_a)
    assert del_res.status_code == 204

