from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from models.customer_profile import CustomerProfile
from models.lead import Lead
import json

router = APIRouter(prefix="/crm", tags=["CRM System"])

def ensure_crm_seeds(db: Session, business_id: str):
    # Empty seed handler — production accounts initialize clean without fake profiles
    pass

@router.get("/profiles", response_model=Dict[str, Any])
def get_crm_profiles(
    segment: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_crm_seeds(db, current_user.business_id)
    
    query = db.query(CustomerProfile).filter(CustomerProfile.business_id == current_user.business_id)
    
    if segment and segment != "All":
        query = query.filter(CustomerProfile.segment == segment)
        
    if search:
        search_query = f"%{search}%"
        query = query.filter(
            CustomerProfile.name.ilike(search_query) |
            CustomerProfile.email.ilike(search_query) |
            CustomerProfile.phone.ilike(search_query) |
            CustomerProfile.tags.ilike(search_query)
        )
        
    profiles = query.order_by(CustomerProfile.lifetime_value.desc()).all()
    
    # Format JSON strings back into lists for API consumers
    response_items = []
    for p in profiles:
        item = {
            "id": p.id,
            "lead_id": p.lead_id,
            "name": p.name,
            "email": p.email,
            "phone": p.phone,
            "segment": p.segment,
            "lifetime_value": p.lifetime_value,
            "notes": p.notes,
            "tags": p.tags,
            "purchase_history": json.loads(p.purchase_history_json or "[]"),
            "interaction_history": json.loads(p.interaction_history_json or "[]"),
            "created_at": p.created_at,
            "updated_at": p.updated_at
        }
        response_items.append(item)
        
    return {"profiles": response_items}

@router.post("/profiles", response_model=Dict[str, Any])
def create_crm_profile(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
        
    profile = CustomerProfile(
        business_id=current_user.business_id,
        name=name,
        email=payload.get("email"),
        phone=payload.get("phone"),
        segment=payload.get("segment", "Standard"),
        lifetime_value=float(payload.get("lifetime_value", 0.0)),
        notes=payload.get("notes"),
        tags=payload.get("tags", ""),
        purchase_history_json=json.dumps(payload.get("purchase_history", [])),
        interaction_history_json=json.dumps([
            {"event": "Profile Configured", "date": datetime.utcnow().strftime("%Y-%m-%d"), "notes": "Customer CRM profile initiated."}
        ])
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return {"status": "success", "id": profile.id}

@router.put("/profiles/{profile_id}", response_model=Dict[str, Any])
@router.patch("/profiles/{profile_id}", response_model=Dict[str, Any])
def update_crm_profile(
    profile_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CustomerProfile).filter(CustomerProfile.id == profile_id, CustomerProfile.business_id == current_user.business_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Customer CRM profile not found")
        
    if "name" in payload:
        profile.name = payload["name"]
    if "email" in payload:
        profile.email = payload["email"]
    if "phone" in payload:
        profile.phone = payload["phone"]
    if "segment" in payload:
        profile.segment = payload["segment"]
    if "lifetime_value" in payload:
        profile.lifetime_value = float(payload["lifetime_value"])
    if "notes" in payload:
        profile.notes = payload["notes"]
    if "tags" in payload:
        profile.tags = payload["tags"]
        
    db.commit()
    return {"status": "success"}

@router.post("/profiles/{profile_id}/history", response_model=Dict[str, Any])
def add_interaction_event(
    profile_id: str,
    payload: Dict[str, str],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CustomerProfile).filter(CustomerProfile.id == profile_id, CustomerProfile.business_id == current_user.business_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Customer CRM profile not found")
        
    event = payload.get("event")
    notes = payload.get("notes")
    if not event or not notes:
        raise HTTPException(status_code=400, detail="event and notes are required fields")
        
    history = json.loads(profile.interaction_history_json or "[]")
    history.append({
        "event": event,
        "date": payload.get("date") or datetime.utcnow().strftime("%Y-%m-%d"),
        "notes": notes
    })
    
    profile.interaction_history_json = json.dumps(history)
    db.commit()
    return {"status": "success", "history": history}

@router.get("/analytics", response_model=Dict[str, Any])
def get_crm_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_crm_seeds(db, current_user.business_id)
    profiles = db.query(CustomerProfile).filter(CustomerProfile.business_id == current_user.business_id).all()
    
    total_customers = len(profiles)
    overall_ltv = sum([p.lifetime_value for p in profiles])
    
    vips = sum([1 for p in profiles if p.segment == "VIP"])
    returning = sum([1 for p in profiles if p.segment == "Returning Customer"])
    high_value = sum([1 for p in profiles if p.segment == "High Value Customer"])
    standard = sum([1 for p in profiles if p.segment == "Standard"])
    
    avg_ltv = (overall_ltv / total_customers) if total_customers > 0 else 0.0
    
    return {
        "total_customers": total_customers,
        "overall_ltv": round(overall_ltv, 2),
        "avg_ltv": round(avg_ltv, 2),
        "segmentation": {
            "VIP": vips,
            "Returning Customer": returning,
            "High Value Customer": high_value,
            "Standard": standard
        }
    }
