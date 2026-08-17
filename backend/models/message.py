import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Text, Index
from sqlalchemy.orm import relationship
from database import Base

class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_conv_created", "conversation_id", "created_at"),
        Index("ix_messages_whatsapp_status", "whatsapp_message_id", "status"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type = Column(String(50), nullable=False) # 'Customer', 'AI', 'Agent'
    sender_id = Column(String(255), nullable=True) # ID of agent, 'AI', or customer phone
    message_type = Column(String(50), default="text", nullable=False) # 'text', 'image', 'document', 'audio', 'video'
    content = Column(Text, nullable=True)
    media_url = Column(Text, nullable=True)
    
    # WhatsApp specific IDs and status tracking
    whatsapp_message_id = Column(String(255), nullable=True, index=True)
    status = Column(String(50), default="sent", nullable=False) # 'sent', 'delivered', 'read', 'failed'
    
    # AI confidence scoring
    confidence_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
