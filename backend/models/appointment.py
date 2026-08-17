import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import relationship
from database import Base

class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        Index("ix_appointments_biz_date", "business_id", "appointment_date"),
        Index("ix_appointments_biz_status", "business_id", "status"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    service_id = Column(String(36), ForeignKey("services.id", ondelete="SET NULL"), nullable=True, index=True)

    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=True, index=True)
    customer_email = Column(String(255), nullable=True)

    appointment_date = Column(DateTime, nullable=False, index=True)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)

    status = Column(String(50), default="Scheduled", nullable=False) # Scheduled, Confirmed, Completed, Cancelled, No-show
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")
    lead = relationship("Lead")
    conversation = relationship("Conversation")
    service = relationship("Service")
