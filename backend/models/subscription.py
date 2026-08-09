import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    
    plan_id = Column(String(50), default="pro", nullable=False) # pro
    provider = Column(String(50), default="razorpay", nullable=False) # razorpay, stripe, apple_iap, google_play, manual
    
    provider_subscription_id = Column(String(255), nullable=True, index=True)
    provider_customer_id = Column(String(255), nullable=True)

    # State Machine: EXPLORING, TRIAL_PENDING, TRIAL_ACTIVE, ACTIVE, PAST_DUE, CANCEL_AT_PERIOD_END, CANCELLED, EXPIRED
    status = Column(String(50), default="EXPLORING", nullable=False, index=True)
    
    # Promotional Tracking
    promo_eligible_at_signup = Column(Boolean, default=False, nullable=False)
    promo_first_cycle_locked = Column(Boolean, default=False, nullable=False)
    promo_first_cycle_used = Column(Boolean, default=False, nullable=False)

    # Pricing & Currency snapshot
    normal_price = Column(Numeric(10, 2), nullable=False, default=999.00)
    first_cycle_price = Column(Numeric(10, 2), nullable=False, default=999.00)
    currency = Column(String(10), default="INR", nullable=False)
    billing_interval = Column(String(20), default="monthly", nullable=False)

    # Timestamps
    trial_started_at = Column(DateTime, nullable=True)
    trial_ends_at = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    business = relationship("Business")
