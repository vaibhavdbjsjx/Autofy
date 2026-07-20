import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    channel = Column(String(50), default="WhatsApp", nullable=False) # WhatsApp, Web, SMS
    platform_sender_id = Column(String(255), nullable=True, index=True) # WhatsApp Phone Number, Web session ID etc.
    status = Column(String(50), default="Active", nullable=False) # Active, Escalated, Resolved
    ai_enabled = Column(Boolean, default=True, nullable=False) # True = AI responds, False = Human agent took over
    summary = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")
    lead = relationship("Lead", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
