import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    user_name = Column(String(255), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True) # e.g., 'TEAM_MEMBER_INVITED', 'PRICE_UPDATED', 'WHATSAPP_DISCONNECTED'
    entity_type = Column(String(50), nullable=False) # e.g., 'Service', 'Team', 'WhatsApp', 'Payment', 'Lead'
    entity_id = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
