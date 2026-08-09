from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from schemas.appointments import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from services.appointment_services import AppointmentCRUD

router = APIRouter(prefix="/appointments", tags=["Appointments & Scheduling"])

@router.get("", response_model=Dict[str, Any])
def get_all_appointments(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Scheduled, Confirmed, Completed, Cancelled, No-show)"),
    search: Optional[str] = Query(None, description="Search by customer name, phone, email, or notes"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List, search, and filter tenant appointments.
    """
    items, total = AppointmentCRUD.list_paginated(
        db,
        business_id=current_user.business_id,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        search=search
    )
    return {
        "items": [AppointmentResponse.model_validate(i) for i in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }

from auth.dependencies import get_current_active_user, FeatureChecker

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(FeatureChecker("appointments_booking")),
    db: Session = Depends(get_db)
):
    """
    Book a new appointment slot for client customer.
    """
    return AppointmentCRUD.create(db, current_user.business_id, payload)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_detail(
    appointment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve specific appointment booking details. Returns 404 for foreign records.
    """
    appt = AppointmentCRUD.get_by_id(db, current_user.business_id, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment record not found.")
    return appt

@router.put("/{appointment_id}", response_model=AppointmentResponse)
@router.patch("/{appointment_id}", response_model=AppointmentResponse)
@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Reschedule date/time or update appointment status.
    """
    appt = AppointmentCRUD.update(db, current_user.business_id, appointment_id, payload)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment record not found.")
    return appt

@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Permanently purge or cancel an appointment booking.
    """
    success = AppointmentCRUD.delete(db, current_user.business_id, appointment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Appointment record not found.")
    return None
