from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from database import get_db
from models.user import User
from models.business import Business
from auth.dependencies import get_current_active_user, RoleChecker

router = APIRouter(prefix="/business", tags=["Business Profiles"])

# Update payload schemas
class BusinessUpdateSchema(BaseModel):
    name: Optional[str] = None
    classification: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    business_hours: Optional[str] = None
    timezone: Optional[str] = None
    is_onboarded: Optional[bool] = None

    # AI Behaviors parameters
    config_agent_name: Optional[str] = None
    config_welcome_message: Optional[str] = None
    config_fallback_message: Optional[str] = None
    config_confidence_threshold: Optional[float] = None

class BusinessResponseSchema(BaseModel):
    id: str
    name: str
    classification: Optional[str] = None
    phone: Optional[str] = None
    email: str
    website: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    business_hours: Optional[str] = None
    timezone: str
    is_onboarded: bool = False
    config_agent_name: str
    config_welcome_message: Optional[str] = None
    config_fallback_message: Optional[str] = None
    config_confidence_threshold: float

@router.get("/profile", response_model=BusinessResponseSchema)
@router.get("/me", response_model=BusinessResponseSchema)
def get_business_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the corporate business entity details corresponding to the caller's organization.
    """
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile entity was not found."
        )
    return business

@router.put("/profile", response_model=BusinessResponseSchema)
@router.put("/update-profile", response_model=BusinessResponseSchema)
@router.patch("/profile", response_model=BusinessResponseSchema)
def update_business_profile(
    payload: BusinessUpdateSchema,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Updates operational business parameters, hours, timezone, or AI parameters.
    Restricted to Owners and Admins only using RBAC.
    """
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile entity not found."
        )

    # Perform recursive updates on specified non-null values
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business, key, value)

    # If updating business profile, automatically mark onboarding as complete
    if payload.is_onboarded is not None:
        business.is_onboarded = payload.is_onboarded
    elif payload.name or payload.classification or payload.phone:
        business.is_onboarded = True

    db.commit()
    db.refresh(business)
    return business

import re

def normalize_and_validate_phone(raw: str) -> str:
    """
    Normalize and validate phone numbers.
    Indian mobile: exactly 10 digits starting with [6-9], normalized to +91XXXXXXXXXX.
    International: must start with +, 7-15 digits total after +.
    """
    cleaned = raw.strip()
    if not cleaned:
        raise ValueError("Phone number cannot be empty.")

    if re.search(r'[a-zA-Z]', cleaned) or re.search(r'[^\d\s\-()+]', cleaned):
        raise ValueError("Phone number must contain only digits, spaces, +, and hyphens.")

    stripped = re.sub(r'[\s\-()]', '', cleaned)

    if stripped.startswith('+'):
        digits = stripped[1:]
        # Fix double prefix: +91916360254763 -> +916360254763
        if digits.startswith('9191') and len(digits) == 14:
            digits = digits[2:]
        # Validate +91 Indian numbers
        if digits.startswith('91'):
            national = digits[2:]
            if len(national) != 10 or national[0] not in '6789':
                raise ValueError("Indian mobile number must be 10 digits starting with 6, 7, 8, or 9.")
            return f"+{digits}"
        # Other international: E.164 requires 7-15 digits after +
        if not (7 <= len(digits) <= 15):
            raise ValueError("International number must have 7-15 digits after +.")
        return f"+{digits}"
    else:
        digits_only = re.sub(r'\D', '', stripped)
        # Strip leading 0 (trunk prefix)
        if digits_only.startswith('0') and len(digits_only) == 11:
            digits_only = digits_only[1:]
        # Strip leading 91 (country code without +)
        if digits_only.startswith('91') and len(digits_only) == 12:
            national = digits_only[2:]
            if national[0] in '6789':
                digits_only = national
        # Must be exactly 10 digits starting with 6-9
        if len(digits_only) == 10 and digits_only[0] in '6789':
            return f"+91{digits_only}"
        raise ValueError("Enter a valid 10-digit Indian mobile number (starting with 6-9) or international number with + country code.")

class OnboardingCompletionRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Business Name")
    classification: str = Field(..., min_length=2, description="Industry Type")
    phone: str = Field(..., min_length=5, description="Business Phone Number")
    website: Optional[str] = None
    address: Optional[str] = None

@router.post("/complete-onboarding", response_model=BusinessResponseSchema)
def complete_onboarding(
    payload: OnboardingCompletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Explicitly validates required corporate parameters, persists them atomically,
    and marks onboarding as complete for the caller's business workspace.
    """
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business entity not found."
        )

    clean_name = payload.name.strip()
    clean_classification = payload.classification.strip()

    if len(clean_name) < 2 or len(clean_classification) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Valid business name and industry type are required to complete onboarding."
        )

    try:
        clean_phone = normalize_and_validate_phone(payload.phone)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err)
        )

    business.name = clean_name
    business.classification = clean_classification
    business.phone = clean_phone
    if payload.website is not None:
        business.website = payload.website.strip()
    if payload.address is not None:
        business.address = payload.address.strip()

    business.is_onboarded = True
    db.commit()
    db.refresh(business)
    return business

@router.get("/dashboard-summary")
def get_dashboard_summary(
    demo: Optional[bool] = Query(False, description="Force demo preview data mode"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Consolidated tenant-isolated dashboard metrics endpoint.
    Derives identity strictly from current_user.business_id.
    Returns live database calculations or sample preview mode data.
    """
    from models.payment import Payment
    from models.lead import Lead
    from models.conversation import Conversation
    from models.message import Message
    from models.product import Product
    from models.service import Service
    from models.support_ticket import SupportTicket
    from datetime import datetime, timedelta

    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not biz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile entity not found."
        )

    biz_id = current_user.business_id

    if demo:
        # User explicitly requested DEMO mode payload for preview
        return {
            "mode": "demo",
            "business": {
                "id": biz.id,
                "name": biz.name,
                "configured": False
            },
            "period": {
                "label": "This Month",
                "start": datetime.utcnow().replace(day=1).strftime("%Y-%m-%d"),
                "end": datetime.utcnow().strftime("%Y-%m-%d")
            },
            "metrics": {
                "revenue": 24965,
                "revenue_change_percent": 20,
                "active_leads": 4,
                "ai_resolution_rate": 99.8,
                "whatsapp_chats": 4,
                "appointments": 3,
                "customer_interactions": 47,
                "escalations": 1
            },
            "revenue_series": [
                {"label": "1 Jul", "value": 4200},
                {"label": "8 Jul", "value": 9800},
                {"label": "15 Jul", "value": 14500},
                {"label": "22 Jul", "value": 19200},
                {"label": "29 Jul", "value": 24965}
            ],
            "recent_conversations": [
                {
                    "id": "demo-c1",
                    "name": "Priya Patel",
                    "phone": "+91 98765 01234",
                    "lastMessage": "Sounds perfect. Scheduled for tomorrow 4:00 PM",
                    "time": "10:14 AM",
                    "status": "Replied",
                    "unread": False,
                    "channel": "WhatsApp",
                    "ai_enabled": True
                },
                {
                    "id": "demo-c2",
                    "name": "Rahul Sharma",
                    "phone": "+91 91234 56789",
                    "lastMessage": "Is there any direct UPI pay option available?",
                    "time": "09:42 AM",
                    "status": "Waiting",
                    "unread": True,
                    "channel": "WhatsApp",
                    "ai_enabled": True
                },
                {
                    "id": "demo-c3",
                    "name": "Amit Verma",
                    "phone": "+91 85544 32109",
                    "lastMessage": "Can a human agent escalate my request?",
                    "time": "Yesterday",
                    "status": "Escalated",
                    "unread": False,
                    "channel": "WhatsApp",
                    "ai_enabled": False
                },
                {
                    "id": "demo-c4",
                    "name": "Ananya Saxena",
                    "phone": "+91 74011 22334",
                    "lastMessage": "Thank you, that answers all my queries!",
                    "time": "Yesterday",
                    "status": "Replied",
                    "unread": False,
                    "channel": "WhatsApp",
                    "ai_enabled": True
                }
            ],
            "recent_activity": [
                {"id": "act-1", "title": "Appointment Booked", "subtitle": "Priya Patel confirmed for 4:00 PM session", "time": "10:14 AM", "type": "appointment"},
                {"id": "act-2", "title": "Inbound Inquiry", "subtitle": "Rahul Sharma asked about UPI payment option", "time": "09:42 AM", "type": "chat"},
                {"id": "act-3", "title": "Human Escalation Flag", "subtitle": "Amit Verma requested human manager review", "time": "Yesterday", "type": "ai"},
                {"id": "act-4", "title": "Lead Qualified", "subtitle": "Ananya Saxena scored 85/100 interest benchmark", "time": "Yesterday", "type": "lead"}
            ]
        }

    # LIVE MODE: Calculate real tenant metrics from database
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # 1. Revenue: Only count paid payments
    paid_payments = db.query(Payment).filter(
        Payment.business_id == biz_id,
        Payment.status == "paid"
    ).all()
    
    current_paid = [p for p in paid_payments if p.created_at >= month_start]
    prev_paid = [p for p in paid_payments if prev_month_start <= p.created_at < month_start]

    revenue_val = float(sum(p.amount for p in current_paid)) if current_paid else 0.0
    prev_rev_val = float(sum(p.amount for p in prev_paid)) if prev_paid else 0.0

    rev_change_pct = None
    if prev_rev_val > 0:
        rev_change_pct = round(((revenue_val - prev_rev_val) / prev_rev_val) * 100, 1)

    # Revenue series calculation
    revenue_series = []
    if paid_payments:
        days = max(1, (now - month_start).days)
        step = max(1, days // 4)
        for i in range(5):
            cutoff = month_start + timedelta(days=min(days, i * step))
            val = float(sum(p.amount for p in paid_payments if p.created_at <= cutoff))
            revenue_series.append({
                "label": cutoff.strftime("%d %b"),
                "value": round(val, 2)
            })

    # 2. Active Leads
    active_leads_count = db.query(Lead).filter(
        Lead.business_id == biz_id,
        Lead.status.in_(["New", "Contacted", "Qualified", "Interested"])
    ).count()

    # 3. Appointments
    from models.appointment import Appointment
    active_appts_count = db.query(Appointment).filter(
        Appointment.business_id == biz_id,
        Appointment.status.in_(["Scheduled", "Confirmed"])
    ).count()

    # 4. WhatsApp Conversations & Customer Interactions
    convs = db.query(Conversation).filter(Conversation.business_id == biz_id).all()
    whatsapp_chats_count = len(convs)

    conv_ids = [c.id for c in convs]
    customer_interactions = 0
    if conv_ids:
        customer_interactions = db.query(Message).filter(Message.conversation_id.in_(conv_ids)).count()

    # 5. AI Resolution Rate & Escalations
    ai_resolution_rate = None
    escalations = None
    if whatsapp_chats_count > 0:
        resolved_count = sum(1 for c in convs if c.status == "Resolved" or (c.ai_enabled and c.status != "Escalated"))
        ai_resolution_rate = round((resolved_count / whatsapp_chats_count) * 100, 1)
        escalations = sum(1 for c in convs if c.status == "Escalated" or not c.ai_enabled)

    # 6. Recent Conversations
    recent_conv_models = db.query(Conversation).filter(
        Conversation.business_id == biz_id
    ).order_by(Conversation.updated_at.desc()).limit(5).all()

    recent_conversations = []
    for c in recent_conv_models:
        lead_name = c.lead.name if c.lead else "Customer"
        lead_phone = c.lead.phone if c.lead else (c.platform_sender_id or "N/A")
        
        last_msg = db.query(Message).filter(
            Message.conversation_id == c.id
        ).order_by(Message.created_at.desc()).first()

        last_text = last_msg.content if last_msg else (c.summary or "New conversation")
        msg_time = last_msg.created_at.strftime("%I:%M %p") if last_msg else c.updated_at.strftime("%I:%M %p")

        recent_conversations.append({
            "id": c.id,
            "name": lead_name,
            "phone": lead_phone,
            "lastMessage": last_text,
            "time": msg_time,
            "status": "Escalated" if c.status == "Escalated" else ("Replied" if c.ai_enabled else "Waiting"),
            "unread": c.status == "Escalated",
            "channel": c.channel,
            "ai_enabled": c.ai_enabled
        })

    # 7. Recent Activity Timeline
    recent_activity = []
    if conv_ids:
        recent_messages = db.query(Message).filter(
            Message.conversation_id.in_(conv_ids)
        ).order_by(Message.created_at.desc()).limit(3).all()

        for m in recent_messages:
            recent_activity.append({
                "id": f"act-m-{m.id}",
                "title": "Customer Message",
                "subtitle": f"{m.sender_type}: {m.content[:50] if m.content else 'Media message'}",
                "time": m.created_at.strftime("%I:%M %p"),
                "type": "chat" if m.sender_type == "Customer" else "ai"
            })

    recent_leads = db.query(Lead).filter(
        Lead.business_id == biz_id
    ).order_by(Lead.created_at.desc()).limit(2).all()

    for l in recent_leads:
        recent_activity.append({
            "id": f"act-l-{l.id}",
            "title": "Lead Registered",
            "subtitle": f"{l.name or 'New Lead'} via {l.source}",
            "time": l.created_at.strftime("%I:%M %p"),
            "type": "lead"
        })

    return {
        "mode": "live",
        "business": {
            "id": biz.id,
            "name": biz.name,
            "configured": True
        },
        "period": {
            "label": "This Month",
            "start": month_start.strftime("%Y-%m-%d"),
            "end": now.strftime("%Y-%m-%d")
        },
        "metrics": {
            "revenue": round(revenue_val, 2),
            "revenue_change_percent": rev_change_pct,
            "active_leads": active_leads_count,
            "ai_resolution_rate": ai_resolution_rate,
            "whatsapp_chats": whatsapp_chats_count,
            "appointments": active_appts_count,
            "customer_interactions": customer_interactions,
            "escalations": escalations
        },
        "revenue_series": revenue_series,
        "recent_conversations": recent_conversations,
        "recent_activity": recent_activity
    }
