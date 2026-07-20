from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# ==================== MESSAGE SCHEMAS ====================
class MessageBase(BaseModel):
    sender_type: str = Field(..., description="'Customer', 'AI', or 'Agent'")
    sender_id: Optional[str] = None
    message_type: str = Field("text", description="'text', 'image', 'document', 'audio', 'video'")
    content: Optional[str] = None
    media_url: Optional[str] = None
    status: str = Field("sent")

class MessageCreate(MessageBase):
    whatsapp_message_id: Optional[str] = None
    confidence_score: Optional[float] = None

class MessageUpdate(BaseModel):
    status: Optional[str] = None
    whatsapp_message_id: Optional[str] = None

class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    whatsapp_message_id: Optional[str] = None
    confidence_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== CONVERSATION SCHEMAS ====================
class ConversationBase(BaseModel):
    lead_id: Optional[str] = None
    channel: str = Field("WhatsApp", max_length=50)
    platform_sender_id: Optional[str] = Field(None, max_length=255)
    status: str = Field("Active", max_length=50)
    ai_enabled: bool = True
    summary: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    lead_id: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    ai_enabled: Optional[bool] = None
    summary: Optional[str] = None

class ConversationResponse(ConversationBase):
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

# For AI Responses specifically
class AIResponseOutput(BaseModel):
    content: str
    confidence_score: float
    matched_faqs: List[str] = []
    retrieved_documents: List[str] = []
    escalated_to_human: bool = False
    escalation_reason: Optional[str] = None
