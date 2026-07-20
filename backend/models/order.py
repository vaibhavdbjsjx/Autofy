import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Customer Details
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=True)
    shipping_address = Column(Text, nullable=False)
    
    # Financial values
    items_json = Column(Text, nullable=False) # JSON-serialized list of ordered products e.g. [{"id": "p-1", "name": "AEW Exhaust", "quantity": 1, "price": 5850.00}]
    total_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    # Statuses: Pending, Confirmed, Packed, Shipped, Delivered, Cancelled, Refunded
    status = Column(String(50), default="Pending", nullable=False)
    
    # Tracking Details
    shipping_carrier = Column(String(100), nullable=True)
    tracking_number = Column(String(255), nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    
    # Cancellation & Refund details
    cancellation_reason = Column(Text, nullable=True)
    refund_reason = Column(Text, nullable=True)
    refund_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to Business
    business = relationship("Business")
