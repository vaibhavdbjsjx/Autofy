import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.lead import Lead
from models.service import Service
from models.appointment import Appointment
from services.appointment_services import AppointmentCRUD
from schemas.appointments import AppointmentCreate, AppointmentUpdate

def test_create_appointment_success(db_session: Session):
    """
    Verify creating an appointment persists to DB and populates default status & timezone.
    """
    biz = Business(id="biz-appt-1", name="Appt Biz 1", email="appt1@test.com", classification="Automotive")
    db_session.add(biz)
    db_session.commit()

    payload = AppointmentCreate(
        customer_name="Alice Smith",
        customer_phone="919876543210",
        customer_email="alice@test.com",
        appointment_date=datetime.utcnow() + timedelta(days=1),
        start_time="10:00 AM",
        end_time="11:00 AM",
        notes="First consultation"
    )

    appt = AppointmentCRUD.create(db_session, "biz-appt-1", payload)
    assert appt.id is not None
    assert appt.customer_name == "Alice Smith"
    assert appt.status == "Scheduled"
    assert appt.business_id == "biz-appt-1"

def test_appointment_tenant_isolation(db_session: Session):
    """
    Verify Business B cannot read, update, or delete Business A's appointment.
    """
    biz_a = Business(id="biz-appt-a", name="Appt Biz A", email="appta@test.com", classification="Automotive")
    biz_b = Business(id="biz-appt-b", name="Appt Biz B", email="apptb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    appt_a = Appointment(
        id="appt-a-100",
        business_id="biz-appt-a",
        customer_name="Customer A",
        appointment_date=datetime.utcnow() + timedelta(days=1),
        start_time="02:00 PM"
    )
    db_session.add(appt_a)
    db_session.commit()

    # Business B attempts to retrieve Business A's appointment
    found_b = AppointmentCRUD.get_by_id(db_session, "biz-appt-b", "appt-a-100")
    assert found_b is None

    # Business B attempts to update Business A's appointment
    upd = AppointmentCRUD.update(db_session, "biz-appt-b", "appt-a-100", AppointmentUpdate(status="Confirmed"))
    assert upd is None

    # Business B attempts to delete Business A's appointment
    del_res = AppointmentCRUD.delete(db_session, "biz-appt-b", "appt-a-100")
    assert del_res is False

def test_foreign_lead_id_rejection(db_session: Session):
    """
    Verify creating an appointment with a lead_id belonging to another business raises HTTP 400.
    """
    biz_a = Business(id="biz-lead-a", name="Lead Biz A", email="la@test.com", classification="Automotive")
    biz_b = Business(id="biz-lead-b", name="Lead Biz B", email="lb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    lead_b = Lead(id="lead-b-99", business_id="biz-lead-b", name="User B", phone="919999999999")
    db_session.add(lead_b)
    db_session.commit()

    payload = AppointmentCreate(
        customer_name="Attacking User",
        appointment_date=datetime.utcnow() + timedelta(days=2),
        start_time="03:00 PM",
        lead_id="lead-b-99" # Belongs to Business B!
    )

    with pytest.raises(Exception) as exc_info:
        AppointmentCRUD.create(db_session, "biz-lead-a", payload)
    assert "Invalid lead_id" in str(exc_info.value)

def test_foreign_service_id_rejection(db_session: Session):
    """
    Verify creating an appointment with a service_id belonging to another business raises HTTP 400.
    """
    biz_a = Business(id="biz-svc-a", name="Svc Biz A", email="sa@test.com", classification="Automotive")
    biz_b = Business(id="biz-svc-b", name="Svc Biz B", email="sb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    svc_b = Service(id="svc-b-88", business_id="biz-svc-b", name="Service B", price=500.0)
    db_session.add(svc_b)
    db_session.commit()

    payload = AppointmentCreate(
        customer_name="Attacking Service User",
        appointment_date=datetime.utcnow() + timedelta(days=2),
        start_time="04:00 PM",
        service_id="svc-b-88" # Belongs to Business B!
    )

    with pytest.raises(Exception) as exc_info:
        AppointmentCRUD.create(db_session, "biz-svc-a", payload)
    assert "Invalid service_id" in str(exc_info.value)

def test_collision_double_booking_conflict(db_session: Session):
    """
    Verify attempting to book the exact same time slot twice for the same business raises 409 Conflict.
    """
    biz = Business(id="biz-conflict-1", name="Conflict Biz", email="conflict@test.com", classification="Automotive")
    db_session.add(biz)
    db_session.commit()

    target_date = datetime(2026, 8, 10, 10, 0, 0)
    payload1 = AppointmentCreate(
        customer_name="First Booker",
        appointment_date=target_date,
        start_time="10:00 AM"
    )
    AppointmentCRUD.create(db_session, "biz-conflict-1", payload1)

    payload2 = AppointmentCreate(
        customer_name="Second Booker (Collision)",
        appointment_date=target_date,
        start_time="10:00 AM"
    )

    with pytest.raises(Exception) as exc_info:
        AppointmentCRUD.create(db_session, "biz-conflict-1", payload2)
    assert "Time slot conflict" in str(exc_info.value)

def test_appointment_status_update_and_reschedule(db_session: Session):
    """
    Verify updating appointment status and start/end time.
    """
    biz = Business(id="biz-upd-1", name="Update Biz", email="upd@test.com", classification="Automotive")
    db_session.add(biz)
    db_session.commit()

    appt = Appointment(
        id="appt-upd-1",
        business_id="biz-upd-1",
        customer_name="Status User",
        appointment_date=datetime.utcnow() + timedelta(days=1),
        start_time="01:00 PM",
        status="Scheduled"
    )
    db_session.add(appt)
    db_session.commit()

    updated = AppointmentCRUD.update(db_session, "biz-upd-1", "appt-upd-1", AppointmentUpdate(status="Confirmed", start_time="01:30 PM"))
    assert updated.status == "Confirmed"
    assert updated.start_time == "01:30 PM"

def test_empty_business_zero_appointments(db_session: Session):
    """
    Verify a brand-new business returns 0 appointments.
    """
    biz_empty = Business(id="biz-empty-appt", name="Empty Appt Biz", email="eappt@test.com", classification="Automotive")
    db_session.add(biz_empty)
    db_session.commit()

    items, count = AppointmentCRUD.list_paginated(db_session, "biz-empty-appt")
    assert count == 0
    assert len(items) == 0
