import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, DateTime, Numeric
from sqlalchemy.orm import relationship
from database import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    classification = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    website = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    business_hours = Column(String(100), nullable=True)
    timezone = Column(String(100), default="IST - Kolkata (GMT+5:30)")

    # AI Configurations
    config_agent_name = Column(String(100), default="AutoBot Elite")
    config_welcome_message = Column(Text, nullable=True)
    config_fallback_message = Column(Text, nullable=True)
    config_confidence_threshold = Column(Float, default=0.78)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Database Relationships
    users = relationship("User", back_populates="business", cascade="all, delete-orphan")
    team_members = relationship("TeamMember", back_populates="business", cascade="all, delete-orphan")
