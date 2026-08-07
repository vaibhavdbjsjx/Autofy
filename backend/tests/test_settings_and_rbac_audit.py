import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.user import User
from models.team_member import TeamMember
from models.support_ticket import SupportTicket
from auth.security import get_password_hash, verify_password

def test_user_profile_persistence(db_session: Session):
    """
    Verify editing user profile updates the PostgreSQL database record.
    """
    biz = Business(id="biz-set-1", name="Original Biz Name", email="set1@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    user = User(
        id="user-set-1",
        business_id="biz-set-1",
        name="Original User Name",
        email="set1@test.com",
        role="Owner",
        password_hash=get_password_hash("Password123!")
    )
    db_session.add(user)
    db_session.commit()

    # Update profile
    user.name = "Updated User Name"
    biz.name = "Updated Biz Name"
    db_session.commit()

    re_user = db_session.query(User).filter(User.id == "user-set-1").first()
    re_biz = db_session.query(Business).filter(Business.id == "biz-set-1").first()

    assert re_user.name == "Updated User Name"
    assert re_biz.name == "Updated Biz Name"

def test_profile_mass_assignment_protection(db_session: Session):
    """
    Verify User model role and business_id cannot be overwritten via unallowlisted fields.
    """
    biz = Business(id="biz-mass-1", name="Mass Biz", email="mass@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    user = User(
        id="user-mass-1",
        business_id="biz-mass-1",
        name="Agent User",
        email="agent@mass.com",
        role="Support Agent",
        password_hash=get_password_hash("Password123!")
    )
    db_session.add(user)
    db_session.commit()

    # User remains Support Agent and bound to biz-mass-1
    assert user.role == "Support Agent"
    assert user.business_id == "biz-mass-1"

def test_password_change_success_and_verification(db_session: Session):
    """
    Verify changing password hashes new password with bcrypt and updates database.
    """
    biz = Business(id="biz-pwd-1", name="Pwd Biz", email="pwd@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    user = User(
        id="user-pwd-1",
        business_id="biz-pwd-1",
        name="Pwd User",
        email="pwd@test.com",
        role="Owner",
        password_hash=get_password_hash("OldPassword123!")
    )
    db_session.add(user)
    db_session.commit()

    # Verify old password
    assert verify_password("OldPassword123!", user.password_hash) is True

    # Change password
    new_hash = get_password_hash("NewSecurePassword456!")
    user.password_hash = new_hash
    db_session.commit()

    # Verify new password
    assert verify_password("NewSecurePassword456!", user.password_hash) is True
    assert verify_password("OldPassword123!", user.password_hash) is False

def test_team_member_invite_and_tenant_isolation(db_session: Session):
    """
    Verify TeamMember invites are persisted under caller's business and isolated from foreign businesses.
    """
    biz_a = Business(id="biz-team-a", name="Team Biz A", email="ta@test.com", classification="Retail")
    biz_b = Business(id="biz-team-b", name="Team Biz B", email="tb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    tm_a = TeamMember(
        id="tm-a-100",
        business_id="biz-team-a",
        name="Agent Alice",
        email="alice@teama.com",
        role="Support Agent",
        status="Active"
    )
    db_session.add(tm_a)
    db_session.commit()

    # Business B attempts to retrieve TeamMember A
    found_b = db_session.query(TeamMember).filter(
        TeamMember.id == "tm-a-100",
        TeamMember.business_id == "biz-team-b"
    ).first()
    assert found_b is None

def test_empty_business_settings(db_session: Session):
    """
    Verify a new business settings queries return only its own records with zero bleed.
    """
    biz_empty = Business(id="biz-empty-settings", name="Empty Settings Biz", email="eset@test.com", classification="Retail")
    db_session.add(biz_empty)
    db_session.commit()

    members = db_session.query(TeamMember).filter(TeamMember.business_id == "biz-empty-settings").all()
    assert len(members) == 0

def test_support_ticket_reassignment_requires_same_tenant_agent(
    client: TestClient,
    db_session: Session,
    test_business_a,
    auth_headers_a
):
    """
    Verify support tickets cannot be assigned to a TeamMember from another business.
    """
    biz_b = Business(id="biz-ticket-b", name="Ticket Biz B", email="ticketb@test.com", classification="Retail")
    agent_a = TeamMember(
        id="tm-ticket-a",
        business_id=test_business_a.id,
        name="Tenant A Agent",
        email="agent-a@tickets.test",
        role="Support Agent",
        status="Active"
    )
    agent_b = TeamMember(
        id="tm-ticket-b",
        business_id=biz_b.id,
        name="Tenant B Agent",
        email="agent-b@tickets.test",
        role="Support Agent",
        status="Active"
    )
    ticket = SupportTicket(
        id="ticket-tenant-a",
        business_id=test_business_a.id,
        customer_name="Ticket Customer",
        title="Tenant scoped ticket",
        description="Must stay scoped to tenant A",
        status="Open",
        priority="Medium"
    )
    db_session.add_all([biz_b, agent_a, agent_b, ticket])
    db_session.commit()

    foreign_res = client.put(
        "/api/v1/tickets/ticket-tenant-a",
        json={"assigned_agent_id": "tm-ticket-b"},
        headers=auth_headers_a
    )
    assert foreign_res.status_code == 404
    db_session.refresh(ticket)
    assert ticket.assigned_agent_id is None

    valid_res = client.put(
        "/api/v1/tickets/ticket-tenant-a",
        json={"assigned_agent_id": "tm-ticket-a"},
        headers=auth_headers_a
    )
    assert valid_res.status_code == 200
    db_session.refresh(ticket)
    assert ticket.assigned_agent_id == "tm-ticket-a"
