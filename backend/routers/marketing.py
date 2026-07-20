from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from models.marketing import Campaign, BroadcastMessage
from datetime import datetime, timedelta

router = APIRouter(prefix="/marketing", tags=["Marketing Automation"])

def ensure_marketing_seeds(db: Session, business_id: str):
    campaign_count = db.query(Campaign).filter(Campaign.business_id == business_id).count()
    if campaign_count == 0:
        c1 = Campaign(
            business_id=business_id,
            name="AEW Exhaust Summer Blockloader Promo",
            channel="WhatsApp",
            status="Completed",
            scheduled_at=datetime.utcnow() - timedelta(days=5),
            target_segment="VIP",
            content="Hey Royal Riding Champion! Get an exclusive flat ₹1,200 discount on our lightweight AEW exhausts for Classic 350. Valid until this Friday! Order now at local shop.",
            sent_count=180,
            open_rate=0.92,  # 92% standard open rate for WhatsApp
            click_rate=0.48, # 48% click rate
            conversion_rate=0.15, # 15% conversion rate
            revenue_generated=32400.0,
            created_at=datetime.utcnow() - timedelta(days=6)
        )
        
        c2 = Campaign(
            business_id=business_id,
            name="Stealth Helmet clearance clearance clearance",
            channel="WhatsApp",
            status="Completed",
            scheduled_at=datetime.utcnow() - timedelta(days=2),
            target_segment="Returning Customer",
            content="Exclusive Deal: Get up to 25% off on our brand new Stealth Knight Full Face Helmets. Direct premium protection at low price.",
            sent_count=320,
            open_rate=0.88,
            click_rate=0.35,
            conversion_rate=0.08,
            revenue_generated=18400.0,
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        
        c3 = Campaign(
            business_id=business_id,
            name="Weekend Fitting Workshop Launch",
            channel="WhatsApp",
            status="Scheduled",
            scheduled_at=datetime.utcnow() + timedelta(days=2),
            target_segment="All",
            content="Exciting updates! Our brand new exhaust fitting lab at Sector 17 Vashi, Navi Mumbai is now official. Book a weekend slot for high custom exhaust sound tests.",
            sent_count=0,
            open_rate=0.0,
            click_rate=0.0,
            conversion_rate=0.0,
            revenue_generated=0.0,
            created_at=datetime.utcnow()
        )
        
        db.add_all([c1, c2, c3])
        db.commit()
        
        # Add some mock broadcasts for campaign 1
        b1 = BroadcastMessage(
            campaign_id=c1.id,
            recipient_name="Rahul Sharma",
            recipient_phone="+91 98765 43210",
            status="Converted",
            sent_at=datetime.utcnow() - timedelta(days=5),
            delivered_at=datetime.utcnow() - timedelta(days=5),
            clicked_at=datetime.utcnow() - timedelta(days=5),
            converted_at=datetime.utcnow() - timedelta(days=5)
        )
        b2 = BroadcastMessage(
            campaign_id=c1.id,
            recipient_name="John Doe",
            recipient_phone="+1 (555) 019-2834",
            status="Clicked",
            sent_at=datetime.utcnow() - timedelta(days=5),
            delivered_at=datetime.utcnow() - timedelta(days=5),
            clicked_at=datetime.utcnow() - timedelta(days=5)
        )
        b3 = BroadcastMessage(
            campaign_id=c1.id,
            recipient_name="Amit Patel",
            recipient_phone="+91 99112 23344",
            status="Delivered",
            sent_at=datetime.utcnow() - timedelta(days=5),
            delivered_at=datetime.utcnow() - timedelta(days=5)
        )
        db.add_all([b1, b2, b3])
        db.commit()

@router.get("/campaigns", response_model=Dict[str, Any])
def get_campaigns(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_marketing_seeds(db, current_user.business_id)
    campaigns = db.query(Campaign).filter(Campaign.business_id == current_user.business_id).order_by(Campaign.created_at.desc()).all()
    return {"campaigns": campaigns}

@router.post("/campaigns", response_model=Dict[str, Any])
def create_campaign(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    name = payload.get("name")
    content = payload.get("content")
    if not name or not content:
        raise HTTPException(status_code=400, detail="name and content are required")
        
    scheduled_at_str = payload.get("scheduled_at")
    scheduled_at = None
    if scheduled_at_str:
        scheduled_at = datetime.fromisoformat(scheduled_at_str.replace("Z", "+00:00"))
        
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

@router.post("/campaigns/{campaign_id}/send", response_model=Dict[str, Any])
def trigger_send_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.business_id == current_user.business_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    camp.status = "Completed"
    camp.scheduled_at = datetime.utcnow()
    
    # Mock send numbers setting standard marketing response metrics
    camp.sent_count = 150
    camp.open_rate = 0.90
    camp.click_rate = 0.42
    camp.conversion_rate = 0.12
    camp.revenue_generated = 14400.0
    
    # Broadcast entries matching target
    b_msg = BroadcastMessage(
        campaign_id=camp.id,
        recipient_phone="+91 99999 88888",
        recipient_name="Auto Qualified Recipient",
        status="Sent",
        sent_at=datetime.utcnow()
    )
    db.add(b_msg)
    db.commit()
    return {"status": "success", "campaign": camp}

@router.get("/campaigns/{campaign_id}/broadcasts", response_model=Dict[str, Any])
def get_campaign_broadcasts(
    campaign_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.business_id == current_user.business_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    broadcasts = db.query(BroadcastMessage).filter(BroadcastMessage.campaign_id == campaign_id).all()
    return {"broadcasts": broadcasts}

@router.get("/analytics", response_model=Dict[str, Any])
def get_marketing_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_marketing_seeds(db, current_user.business_id)
    camps = db.query(Campaign).filter(Campaign.business_id == current_user.business_id, Campaign.status == "Completed").all()
    
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
