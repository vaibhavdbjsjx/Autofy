import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, String, Text, Float, DateTime, Numeric, Boolean
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
    is_onboarded = Column(Boolean, default=False, nullable=False)

    description = Column(Text, nullable=True)
    currency = Column(String(10), default="INR (₹)")
    language = Column(String(50), default="English")

    # Meta WhatsApp Configurations
    whatsapp_phone_id = Column(String(100), nullable=True, index=True)

    # AI Configurations
    config_agent_name = Column(String(100), default="AutoBot Elite")
    config_welcome_message = Column(Text, nullable=True)
    config_fallback_message = Column(Text, nullable=True)
    config_confidence_threshold = Column(Float, default=0.78)
    
    # AI Personality & Tone Controls
    ai_personality = Column(String(100), default="Professional & Helpful")
    ai_tone = Column(String(100), default="Warm & Concise")
    ai_sales_behavior = Column(String(100), default="Consultative & Solution-Oriented")
    ai_reply_style = Column(String(100), default="Structured with Bullet Points")
    ai_escalation_rules = Column(Text, nullable=True)

    # AI Auto-Reply Global Controls
    ai_auto_reply_enabled = Column(Boolean, default=True, nullable=False)  # Global master switch for all AI replies
    ai_reply_exceptions = Column(Text, nullable=True)  # JSON array of phone numbers excluded from AI replies

    # 15-Day Account Promotional Tracking
    promo_started_at = Column(DateTime, default=datetime.utcnow)
    promo_expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=15))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Database Relationships
    users = relationship("User", back_populates="business", cascade="all, delete-orphan")
    team_members = relationship("TeamMember", back_populates="business", cascade="all, delete-orphan")
