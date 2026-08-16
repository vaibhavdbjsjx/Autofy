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
    normal_price = Column(Numeric(10, 2), nullable=False, default=699.00)
    first_cycle_price = Column(Numeric(10, 2), nullable=False, default=699.00)
    grandfathered_price = Column(Numeric(10, 2), nullable=True) # Locks pricing for existing subscribers
    price_locked_at = Column(DateTime, nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    billing_interval = Column(String(20), default="monthly", nullable=False) # monthly, yearly

    # Payment method & Lifecycle recovery
    payment_method_summary = Column(String(100), default="UPI / Card (Auto-Debit)", nullable=False)
    last_payment_status = Column(String(50), default="succeeded", nullable=False) # succeeded, failed, pending, refunded
    last_payment_error = Column(Text, nullable=True)
    retry_count = Column(String(10), default="0", nullable=False)
    billing_email = Column(String(255), nullable=True)
    tax_id = Column(String(50), nullable=True)

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
