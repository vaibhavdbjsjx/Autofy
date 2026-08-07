from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from models.marketing import Campaign, BroadcastMessage
from datetime import datetime, timedelta

router = APIRouter(prefix="/marketing", tags=["Marketing Automation"])

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from models.marketing import Campaign, BroadcastMessage
from models.lead import Lead
from services.lead_services import normalize_phone
from datetime import datetime

router = APIRouter(prefix="/marketing", tags=["Marketing Automation"])

@router.get("/campaigns", response_model=Dict[str, Any])
def get_campaigns(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve real tenant campaigns from database.
    """
    campaigns = db.query(Campaign).filter(
        Campaign.business_id == current_user.business_id
    ).order_by(Campaign.created_at.desc()).all()
    
    return {"campaigns": campaigns}

@router.post("/campaigns", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new marketing campaign.
    """
    name = payload.get("name")
    content = payload.get("content")
    if not name or not content:
        raise HTTPException(status_code=400, detail="name and content are required")
        
    scheduled_at_str = payload.get("scheduled_at")
    scheduled_at = None
    if scheduled_at_str:
        try:
            scheduled_at = datetime.fromisoformat(scheduled_at_str.replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid scheduled_at ISO timestamp format.")
        
    camp = Campaign(
        business_id=current_user.business_id,
        name=name,
        target_segment=payload.get("target_segment", "All"),
        content=content,
        channel=payload.get("channel", "WhatsApp"),
        status="Scheduled" if scheduled_at else "Draft",
        scheduled_at=scheduled_at
    )
    
    db.add(camp)
    db.commit()
    db.refresh(camp)
    return {"status": "success", "campaign": camp}

@router.get("/campaigns/{campaign_id}", response_model=Dict[str, Any])
def get_campaign_detail(
    campaign_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Fetch details for a specific campaign. Returns 404 for foreign records.
    """
    camp = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.business_id == current_user.business_id
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign record not found.")
    return {"campaign": camp}

@router.put("/campaigns/{campaign_id}", response_model=Dict[str, Any])
def update_campaign(
    campaign_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update campaign metadata, status, or schedule.
    """
    camp = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.business_id == current_user.business_id
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign record not found.")

    if "name" in payload:
        camp.name = payload["name"]
    if "content" in payload:
        camp.content = payload["content"]
    if "status" in payload:
        camp.status = payload["status"]
    if "target_segment" in payload:
        camp.target_segment = payload["target_segment"]

    db.commit()
    db.refresh(camp)
    return {"status": "success", "campaign": camp}

@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a campaign and associated broadcast entries.
    """
    camp = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.business_id == current_user.business_id
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign record not found.")

    db.delete(camp)
    db.commit()
    return None

@router.post("/campaigns/{campaign_id}/send", response_model=Dict[str, Any])
def trigger_send_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Trigger send execution for a campaign against tenant-scoped, deduplicated leads.
    """
    camp = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.business_id == current_user.business_id
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign record not found.")
        
    # Fetch real leads for this tenant
    lead_query = db.query(Lead).filter(Lead.business_id == current_user.business_id)
    if camp.target_segment and camp.target_segment != "All":
        lead_query = lead_query.filter(Lead.status.ilike(f"%{camp.target_segment}%"))
    
    leads = lead_query.all()
    
    # Deduplicate leads by normalized phone
    seen_phones = set()
    unique_leads = []
    for l in leads:
        norm = normalize_phone(l.phone) if l.phone else None
        if norm and norm not in seen_phones:
            seen_phones.add(norm)
            unique_leads.append(l)

    # Persist broadcast messages for each unique recipient
    created_broadcasts = []
    for l in unique_leads:
        b_msg = BroadcastMessage(
            campaign_id=camp.id,
            recipient_phone=l.phone or "Unknown",
            recipient_name=l.name or "Customer",
            status="Sent",
            sent_at=datetime.utcnow()
        )
        db.add(b_msg)
        created_broadcasts.append(b_msg)

    camp.status = "Completed"
    camp.scheduled_at = datetime.utcnow()
    camp.sent_count = len(unique_leads)
    
    db.commit()
    db.refresh(camp)
    return {
        "status": "success", 
        "campaign": camp, 
        "recipients_count": len(unique_leads)
    }

@router.get("/campaigns/{campaign_id}/broadcasts", response_model=Dict[str, Any])
def get_campaign_broadcasts(
    campaign_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get per-recipient broadcast messages. Returns 404 for foreign campaign access.
    """
    camp = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.business_id == current_user.business_id
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign record not found.")
        
    broadcasts = db.query(BroadcastMessage).filter(BroadcastMessage.campaign_id == campaign_id).all()
    return {"broadcasts": broadcasts}

@router.get("/analytics", response_model=Dict[str, Any])
def get_marketing_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Compute marketing analytics strictly from database records.
    """
    camps = db.query(Campaign).filter(
        Campaign.business_id == current_user.business_id,
        Campaign.status == "Completed"
    ).all()
    
    total_campaigns = len(camps)
    total_revenue_gen = sum([c.revenue_generated for c in camps])
    
    avg_open = 0.0
    avg_click = 0.0
    avg_conv = 0.0
    
    if total_campaigns > 0:
        avg_open = sum([c.open_rate for c in camps]) / total_campaigns
        avg_click = sum([c.click_rate for c in camps]) / total_campaigns
        avg_conv = sum([c.conversion_rate for c in camps]) / total_campaigns
        
    return {
        "completed_campaigns_count": total_campaigns,
        "total_revenue_marketing": round(total_revenue_gen, 2),
        "overall_open_rate": round(avg_open, 2),
        "overall_click_rate": round(avg_click, 2),
        "overall_conversion_rate": round(avg_conv, 2)
    }
