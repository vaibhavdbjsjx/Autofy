from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user, RoleChecker
from models.user import User
from schemas.conversations import (
    ConversationResponse, ConversationUpdate, MessageResponse, MessageCreate, AIResponseOutput
)
from services.conversation_services import ConversationCRUD, MessageCRUD, ConversationalAIService

router = APIRouter(prefix="/conversations", tags=["Conversational AI Chat Threads"])

owner_admin_agent = RoleChecker(["Owner", "Admin", "Manager", "Support Agent"])

@router.get("", response_model=List[ConversationResponse])
def list_conversations(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by state (Active, Escalated, Resolved)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List interactive chat threads (from WhatsApp or Web channels) mapped to client leads.
    """
    return ConversationCRUD.list(db, current_user.business_id, skip=skip, limit=limit, status=status_filter)

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation_detail(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Fetch exact conversation chat timeline and metadata.
    """
    conv = ConversationCRUD.get_by_id(db, current_user.business_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")
    return conv

@router.put("/{conversation_id}", response_model=ConversationResponse)
def update_conversation_status(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Toggles AI automation support (ai_enabled) or state status (Active, Escalated, Resolved).
    Used directly during human handover/takeover flows.
    """
    conv = ConversationCRUD.update(db, current_user.business_id, conversation_id, payload)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")
    return conv

@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_manual_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Allows a human operator (Support Agent/Admin) to manually log or dispatch messages to the thread.
    Automatically disables AI on human takeover.
    """
    conv = ConversationCRUD.get_by_id(db, current_user.business_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")

    # Disable AI reply mode if human operator responds directly to customer query
    if payload.sender_type != "Customer":
        conv.ai_enabled = False
        conv.status = "Active" # Update status out of escalated
        db.commit()

    return MessageCRUD.create(db, conversation_id, payload)

@router.post("/{conversation_id}/reply-ai", response_model=AIResponseOutput)
def trigger_ai_response(
    conversation_id: str,
    customer_message: str = Query(..., description="The query to feed into the Gemini responder model"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Manually triggers AI reply generation using state metadata context retrieved for business.
    Computes confidence level and transfers to human channel if lower than threshold.
    """
    conv = ConversationCRUD.get_by_id(db, current_user.business_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")

    res = ConversationalAIService.reply_with_ai(db, conversation_id, customer_message)
    
    return AIResponseOutput(
        content=res["reply"],
        confidence_score=res["confidence"],
        matched_faqs=res["matched_faqs"],
        escalated_to_human=res["escalate"],
        escalation_reason="Confidence score below compliance threshold" if res["escalate"] else None
    )
