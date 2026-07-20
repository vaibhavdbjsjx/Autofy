import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    status = Column(String(50), default="Open", nullable=False) # Open, Pending, Resolved, Closed
    priority = Column(String(50), default="Medium", nullable=False) # Low, Medium, High, Urgent
    
    assigned_agent_id = Column(String(36), ForeignKey("team_members.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # SLA Tracking metrics
    sla_deadline = Column(DateTime, nullable=True)
    sla_status = Column(String(50), default="Within Limit", nullable=False) # Within Limit, Breached, Met
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")
    assigned_agent = relationship("TeamMember")
    history = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan")


class TicketHistory(Base):
    __tablename__ = "ticket_histories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by = Column(String(100), default="System", nullable=False)
    action = Column(String(255), nullable=False) # Created, Status Changed, Reassigned, Message Added
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("SupportTicket", back_populates="history")
