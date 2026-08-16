import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(String(36), nullable=True, index=True)
    
    invoice_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # Financials
    subtotal = Column(Numeric(10, 2), nullable=False, default=0.00)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    currency = Column(String(10), default="INR", nullable=False)
    
    # Status: paid, pending, failed, refunded, void
    status = Column(String(50), default="paid", nullable=False, index=True)
    
    # Billing period & Dates
    billing_period_start = Column(DateTime, nullable=True)
    billing_period_end = Column(DateTime, nullable=True)
    invoice_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_date = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Payment info
    payment_method = Column(String(100), default="UPI / Credit Card", nullable=False)
    razorpay_payment_id = Column(String(255), nullable=True, index=True)
    razorpay_invoice_id = Column(String(255), nullable=True)
    
    # Itemization & Metadata (Stored as JSON text)
    line_items_json = Column(Text, nullable=True)
    pdf_url = Column(Text, nullable=True)
    customer_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")
