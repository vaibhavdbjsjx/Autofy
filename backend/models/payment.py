import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric, Text, Boolean, Index
from sqlalchemy.orm import relationship
from database import Base

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_biz_status_created", "business_id", "status", "created_at"),
        Index("ix_payments_biz_lead", "business_id", "lead_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    
    amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    currency = Column(String(10), default="INR", nullable=False)
    
    payment_link_id = Column(String(255), nullable=True, index=True)
    payment_link_url = Column(Text, nullable=True)
    
    razorpay_payment_id = Column(String(255), nullable=True, index=True)
    razorpay_order_id = Column(String(255), nullable=True, index=True)
    razorpay_subscription_id = Column(String(255), nullable=True, index=True)
    
    status = Column(String(50), default="issued", nullable=False, index=True) # issued, paid, expired, cancelled, failed, refunded
    billing_type = Column(String(50), default="one-time", nullable=False) # one-time, subscription
    invoice_id = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")
    lead = relationship("Lead")
