from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user, RoleChecker
from models.user import User
from schemas.leads import LeadCreate, LeadUpdate, LeadResponse, LeadScoreResponse
from services.lead_services import LeadCRUD

router = APIRouter(prefix="/leads", tags=["CRM Leads Management"])

# Permissions
owner_admin_manager = RoleChecker(["Owner", "Admin", "Manager"])
any_auth_user = Depends(get_current_active_user)

@router.get("", response_model=Dict[str, Any])
def get_all_leads(
    search: Optional[str] = Query(None, description="Search term for name, email, phone or notes"),
    status: Optional[str] = Query(None, description="Filter by status (New, Contacted, Qualified, Lost, Converted)"),
    source: Optional[str] = Query(None, description="Filter by communication source (e.g., WhatsApp, Web)"),
    min_score: Optional[int] = Query(None, ge=0, description="Minimum performance score filter"),
    max_score: Optional[int] = Query(None, ge=0, description="Maximum performance score filter"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination count limit"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List, filter, paginate, and search organizational lead entities.
    """
    results, total = LeadCRUD.list_paginated(
        db=db,
        business_id=current_user.business_id,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        source=source,
        min_score=min_score,
        max_score=max_score
    )
    return {
        "items": [LeadResponse.model_validate(r) for r in results],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new customer lead contact and run the automated lead scorer.
    """
    return LeadCRUD.create(db, current_user.business_id, payload)

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead_by_id(
    lead_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve precise client lead detail entries by record ID.
    """
    lead = LeadCRUD.get_by_id(db, current_user.business_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead contact profile not found.")
    return lead

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Modify details inside a client profile (auto-scores updated properties).
    """
    lead = LeadCRUD.update(db, current_user.business_id, lead_id, payload)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead contact profile not found.")
    return lead

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: str,
    current_user: User = Depends(owner_admin_manager),
    db: Session = Depends(get_db)
):
    """
    Permanently purge a lead record from active storage listings.
    """
    success = LeadCRUD.delete(db, current_user.business_id, lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead contact profile not found.")
    return None

@router.post("/{lead_id}/recalculate-score", response_model=LeadScoreResponse)
def trigger_score_recalculation(
    lead_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Runs predictive algorithms to score client temperature index and reports matched criteria.
    """
    lead = LeadCRUD.get_by_id(db, current_user.business_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Requested lead profile not found.")
    
    prev_score = lead.score
    new_score, matched_reasons = LeadCRUD.recalculate_score(db, lead)

    return LeadScoreResponse(
        lead_id=lead.id,
        previous_score=prev_score,
        new_score=new_score,
        matched_criteria=matched_reasons,
        notes=f"Calculated qualification level: {lead.status}"
    )
