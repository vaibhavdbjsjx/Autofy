import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from sqlalchemy.orm import relationship
from database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, index=True)
    status = Column(String(50), default="New", nullable=False, index=True) # New, Contacted, Qualified, Lost, Converted
    pipeline_stage = Column(String(50), default="New", nullable=False, index=True) # New, Contacted, Qualified, Proposal, Negotiation, Won, Lost
    source = Column(String(100), default="WhatsApp", nullable=False) # WhatsApp, Web, Manual, Instagram
    score = Column(Integer, default=10, nullable=False) # Lead scoring metric
    deal_value = Column(Integer, default=0, nullable=False)
    
    # CRM & Pipeline Extensions
    tags = Column(Text, nullable=True) # JSON list e.g. ["VIP", "High-Intent", "Hot"]
    notes = Column(Text, nullable=True) # Internal notes
    assigned_to_user_id = Column(String(36), nullable=True, index=True)
    assigned_to_name = Column(String(255), nullable=True)
    follow_up_at = Column(DateTime, nullable=True)
    follow_up_notes = Column(Text, nullable=True)
    converted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")
    conversations = relationship("Conversation", back_populates="lead", cascade="all, delete-orphan")
