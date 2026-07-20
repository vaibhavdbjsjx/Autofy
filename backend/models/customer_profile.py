import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from database import Base

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, index=True)
    
    segment = Column(String(100), default="Standard", nullable=False) # "VIP", "Returning Customer", "High Value Customer", "Standard"
    lifetime_value = Column(Float, default=0.0, nullable=False)
    
    purchase_history_json = Column(Text, default="[]", nullable=False) # JSON list of purchases: [{"order_id", "date", "amount", "items"}]
    interaction_history_json = Column(Text, default="[]", nullable=False) # JSON list of actions: [{"event", "date", "notes"}]
    
    notes = Column(Text, nullable=True)
    tags = Column(String(255), default="", nullable=False) # comma-separated tags e.g. "exhaust, premium"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")
    lead = relationship("Lead")
