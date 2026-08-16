import csv
import io
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user, RoleChecker
from models.user import User
from models.lead import Lead
from schemas.leads import LeadCreate, LeadUpdate, LeadResponse, LeadScoreResponse
from services.lead_services import LeadCRUD
from services.activity_services import ActivityService

router = APIRouter(prefix="/leads", tags=["CRM Leads & Pipeline"])

PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]


@router.get("", response_model=Dict[str, Any])
def get_all_leads(
    search: Optional[str] = Query(None, description="Search term for name, email, phone or notes"),
    status: Optional[str] = Query(None, description="Filter by status"),
    pipeline_stage: Optional[str] = Query(None, description="Filter by pipeline stage"),
    source: Optional[str] = Query(None, description="Filter by communication source (e.g., WhatsApp, Web)"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user ID"),
    tag: Optional[str] = Query(None, description="Filter by tag keyword"),
    min_score: Optional[int] = Query(None, ge=0, description="Minimum performance score filter"),
    max_score: Optional[int] = Query(None, ge=0, description="Maximum performance score filter"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(50, ge=1, le=100, description="Pagination count limit"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List, filter, paginate, and search organizational lead entities.
    """
    query = db.query(Lead).filter(Lead.business_id == current_user.business_id)

    if status:
        query = query.filter(Lead.status == status)
    if pipeline_stage:
        query = query.filter(Lead.pipeline_stage == pipeline_stage)
    if source:
        query = query.filter(Lead.source == source)
    if assigned_to:
        query = query.filter(Lead.assigned_to_user_id == assigned_to)
    if tag:
        query = query.filter(Lead.tags.ilike(f"%{tag}%"))
    if min_score is not None:
        query = query.filter(Lead.score >= min_score)
    if max_score is not None:
        query = query.filter(Lead.score <= max_score)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Lead.name.ilike(search_pattern)) |
            (Lead.email.ilike(search_pattern)) |
            (Lead.phone.ilike(search_pattern)) |
            (Lead.notes.ilike(search_pattern))
        )

    total = query.count()
    results = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "items": [LeadResponse.model_validate(r) for r in results],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/pipeline")
def get_leads_pipeline(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns pipeline board groupings across all stages (New, Contacted, Qualified, Proposal, Negotiation, Won, Lost)
    with total volume, deal values, and metrics.
    """
    leads = db.query(Lead).filter(Lead.business_id == current_user.business_id).all()
    
    stages_data: Dict[str, Dict[str, Any]] = {
        stage: {"stage": stage, "count": 0, "total_value": 0, "leads": []}
        for stage in PIPELINE_STAGES
    }

    for lead in leads:
        stage = lead.pipeline_stage if lead.pipeline_stage in stages_data else "New"
        stages_data[stage]["count"] += 1
        stages_data[stage]["total_value"] += (lead.deal_value or 0)
        stages_data[stage]["leads"].append(LeadResponse.model_validate(lead))

    total_leads = len(leads)
    won_leads = stages_data["Won"]["count"]
    conversion_rate = round((won_leads / total_leads) * 100, 1) if total_leads > 0 else 0.0

    return {
        "stages": list(stages_data.values()),
        "summary": {
            "total_leads": total_leads,
            "won_leads": won_leads,
            "pipeline_value": sum(s["total_value"] for s in stages_data.values()),
            "conversion_rate": conversion_rate
        }
    }


@router.get("/export")
def export_leads_csv(
    current_user: User = Depends(RoleChecker(["Owner", "Admin", "Accountant"])),
    db: Session = Depends(get_db)
):
    """
    Exports all business customer leads in standard CSV format.
    Restricted to Owners, Admins, and Accountants.
    """
    leads = db.query(Lead).filter(Lead.business_id == current_user.business_id).order_by(Lead.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Lead ID", "Name", "Email", "Phone", "Status", "Pipeline Stage",
        "Source", "Score", "Deal Value (INR)", "Tags", "Assigned To",
        "Follow Up At", "Created At"
    ])

    for lead in leads:
        writer.writerow([
            lead.id,
            lead.name or "N/A",
            lead.email or "N/A",
            lead.phone or "N/A",
            lead.status,
            lead.pipeline_stage or "New",
            lead.source,
            lead.score,
            lead.deal_value or 0,
            lead.tags or "",
            lead.assigned_to_name or "Unassigned",
            lead.follow_up_at.isoformat() if lead.follow_up_at else "",
            lead.created_at.isoformat() if lead.created_at else ""
        ])

    output.seek(0)
    filename = f"autofy_leads_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new customer lead contact and run the automated lead scorer.
    """
    lead = LeadCRUD.create(db, current_user.business_id, payload)
    return lead


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
@router.patch("/{lead_id}", response_model=LeadResponse)
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


@router.patch("/{lead_id}/stage", response_model=LeadResponse)
def update_lead_pipeline_stage(
    lead_id: str,
    stage: str = Query(..., description="Target pipeline stage"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Transitions a lead to a new pipeline stage and sets conversion timestamp when Won.
    """
    if stage not in PIPELINE_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {PIPELINE_STAGES}")

    lead = LeadCRUD.get_by_id(db, current_user.business_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    lead.pipeline_stage = stage
    if stage == "Won":
        lead.status = "Converted"
        lead.converted_at = datetime.utcnow()
    elif stage == "Lost":
        lead.status = "Lost"

    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/assign", response_model=LeadResponse)
def assign_lead(
    lead_id: str,
    user_id: Optional[str] = Query(None, description="Team member user ID"),
    user_name: Optional[str] = Query(None, description="Team member name"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Assigns or re-assigns a customer lead to a specific team sales/support member.
    """
    lead = LeadCRUD.get_by_id(db, current_user.business_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    lead.assigned_to_user_id = user_id
    lead.assigned_to_name = user_name
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/follow-up", response_model=LeadResponse)
def schedule_lead_follow_up(
    lead_id: str,
    follow_up_at: datetime = Query(..., description="Follow-up scheduled timestamp"),
    notes: Optional[str] = Query(None, description="Follow-up notes"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Schedules an automated or team follow-up reminder for a lead.
    """
    lead = LeadCRUD.get_by_id(db, current_user.business_id, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    lead.follow_up_at = follow_up_at
    if notes:
        lead.follow_up_notes = notes
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: str,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
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
