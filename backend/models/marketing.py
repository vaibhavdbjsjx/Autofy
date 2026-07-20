import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Float, Integer
from sqlalchemy.orm import relationship
from database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    channel = Column(String(100), default="WhatsApp", nullable=False) # e.g. "WhatsApp", "SMS", "Email"
    status = Column(String(50), default="Draft", nullable=False) # Draft, Scheduled, Completed, Cancelled
    scheduled_at = Column(DateTime, nullable=True)
    
    target_segment = Column(String(100), default="All", nullable=False) # "VIP", "Returning", "Lead", "All"
    content = Column(Text, nullable=False)
    
    # Analytics Tracking Metrics
    sent_count = Column(Integer, default=0, nullable=False)
    open_rate = Column(Float, default=0.0, nullable=False) # e.g. 0.85 (85%)
    click_rate = Column(Float, default=0.0, nullable=False) # e.g. 0.40 (40%)
    conversion_rate = Column(Float, default=0.0, nullable=False)
    revenue_generated = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business")
    broadcasts = relationship("BroadcastMessage", back_populates="campaign", cascade="all, delete-orphan")


class BroadcastMessage(Base):
    __tablename__ = "broadcast_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_name = Column(String(255), nullable=True)
    recipient_phone = Column(String(50), nullable=False, index=True)
    status = Column(String(50), default="Pending", nullable=False) # Pending, Sent, Delivered, Clicked, Converted, Failed
    
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    converted_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="broadcasts")
