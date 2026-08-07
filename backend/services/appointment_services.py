import logging
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.appointment import Appointment
from models.lead import Lead
from models.service import Service
from schemas.appointments import AppointmentCreate, AppointmentUpdate

logger = logging.getLogger("autofy_appointment_services")

class AppointmentCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: AppointmentCreate) -> Appointment:
        # 1. Validate foreign Lead ownership if lead_id is provided
        if obj_in.lead_id:
            lead = db.query(Lead).filter(Lead.id == obj_in.lead_id, Lead.business_id == business_id).first()
            if not lead:
                raise HTTPException(status_code=400, detail="Invalid lead_id: Lead does not belong to your business.")

        # 2. Validate foreign Service ownership if service_id is provided
        if obj_in.service_id:
            service = db.query(Service).filter(Service.id == obj_in.service_id, Service.business_id == business_id).first()
            if not service:
                raise HTTPException(status_code=400, detail="Invalid service_id: Service does not belong to your business.")

        # 3. Lock business workspace row and check collision / double-booking conflict
        from models.business import Business
        db.query(Business).filter(Business.id == business_id).with_for_update().first()

        existing_conflict = db.query(Appointment).filter(
            Appointment.business_id == business_id,
            Appointment.appointment_date == obj_in.appointment_date,
            Appointment.start_time == obj_in.start_time,
            Appointment.status != "Cancelled"
        ).first()

        if existing_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Time slot conflict: An active appointment already exists at {obj_in.start_time} for this date."
            )

        db_obj = Appointment(
            business_id=business_id,
            lead_id=obj_in.lead_id,
            conversation_id=obj_in.conversation_id,
            service_id=obj_in.service_id,
            customer_name=obj_in.customer_name,
            customer_phone=obj_in.customer_phone,
            customer_email=obj_in.customer_email,
            appointment_date=obj_in.appointment_date,
            start_time=obj_in.start_time,
            end_time=obj_in.end_time,
            timezone=obj_in.timezone or "UTC",
            status=obj_in.status or "Scheduled",
            notes=obj_in.notes
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, appointment_id: str) -> Optional[Appointment]:
        return db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.business_id == business_id
        ).first()

    @staticmethod
    def list_paginated(
        db: Session,
        business_id: str,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Appointment], int]:
        query = db.query(Appointment).filter(Appointment.business_id == business_id)

        if status_filter:
            query = query.filter(Appointment.status == status_filter)

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Appointment.customer_name.ilike(pattern),
                    Appointment.customer_phone.ilike(pattern),
                    Appointment.customer_email.ilike(pattern),
                    Appointment.notes.ilike(pattern)
                )
            )

        total_count = query.count()
        results = query.order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit).all()
        return results, total_count

    @staticmethod
    def update(db: Session, business_id: str, appointment_id: str, obj_in: AppointmentUpdate) -> Optional[Appointment]:
        db_obj = AppointmentCRUD.get_by_id(db, business_id, appointment_id)
        if not db_obj:
            return None

        # Validate lead_id / service_id if updated
        if obj_in.lead_id:
            lead = db.query(Lead).filter(Lead.id == obj_in.lead_id, Lead.business_id == business_id).first()
            if not lead:
                raise HTTPException(status_code=400, detail="Invalid lead_id: Lead does not belong to your business.")

        if obj_in.service_id:
            service = db.query(Service).filter(Service.id == obj_in.service_id, Service.business_id == business_id).first()
            if not service:
                raise HTTPException(status_code=400, detail="Invalid service_id: Service does not belong to your business.")

        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, appointment_id: str) -> bool:
        db_obj = AppointmentCRUD.get_by_id(db, business_id, appointment_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True
