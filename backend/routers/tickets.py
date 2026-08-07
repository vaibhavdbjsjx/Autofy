from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from models.support_ticket import SupportTicket, TicketHistory
from models.team_member import TeamMember
from datetime import datetime, timedelta

router = APIRouter(prefix="/tickets", tags=["Support Tickets"])

def ensure_ticket_seeds(db: Session, business_id: str):
    ticket_count = db.query(SupportTicket).filter(SupportTicket.business_id == business_id).count()
    if ticket_count == 0:
        # Load any existing team members to assign, fallback to None
        team = db.query(TeamMember).filter(TeamMember.business_id == business_id).all()
        t1 = team[0].id if len(team) > 0 else None
        t2 = team[1].id if len(team) > 1 else None
        
        tick1 = SupportTicket(
            business_id=business_id,
            customer_name="Rahul Sharma",
            customer_email="rahul.sharma@gmail.com",
            customer_phone="+91 98765 43210",
            title="Slight fitting rattle noise on Royal Enfield AEW",
            description="Since getting my custom AEW single exhaust fitted yesterday, I hear a high-vibration metallic tin rattle around 3000 RPM. Can a slot be booked for retightening?",
            status="Open",
            priority="High",
            assigned_agent_id=t1,
            sla_deadline=datetime.utcnow() + timedelta(hours=24),
            sla_status="Within Limit"
        )
        
        tick2 = SupportTicket(
            business_id=business_id,
            customer_name="John Doe",
            customer_email="john.doe@example.com",
            customer_phone="+1 (555) 019-2834",
            title="Premium gloves carbon seam cracking",
            description="I bought Carbon Dual-Ring Riding Gloves. On the outer left knuckle shield padding, the double seams are stretching out under slight pressure. Please arrange standard size exchange.",
            status="Pending",
            priority="Medium",
            assigned_agent_id=t2,
            sla_deadline=datetime.utcnow() + timedelta(hours=48),
            sla_status="Within Limit"
        )
        
        tick3 = SupportTicket(
            business_id=business_id,
            customer_name="Gurpreet Singh",
            customer_email="gurpreet.customs@gmail.com",
            title="Damaged shipping package container",
            description="The core box delivered via Delhivery was heavily smashed on the top corners. Thankfully the internal exhaust core was heavily bubblewrapped and sustained no scratches.",
            status="Resolved",
            priority="Low",
            assigned_agent_id=t1,
            sla_deadline=datetime.utcnow() - timedelta(hours=6),
            sla_status="Met"
        )
        
        db.add_all([tick1, tick2, tick3])
        db.commit()
        
        # Add seed history
        h1 = TicketHistory(
            ticket_id=tick1.id,
            changed_by="Rahul Sharma",
            action="Created",
            notes="Ticket logged via automated customer portal inquiry."
        )
        h2 = TicketHistory(
            ticket_id=tick1.id,
            changed_by="System",
            action="Reassigned",
            notes="Assignee auto-routed to primary workshop coordinator."
        )
        h3 = TicketHistory(
            ticket_id=tick2.id,
            changed_by="Tech Desk",
            action="Status Changed",
            notes="Marked Pending. Awaiting photograph proofs from the customer on WhatsApp thread."
        )
        db.add_all([h1, h2, h3])
        db.commit()

@router.get("", response_model=Dict[str, Any])
def get_tickets(
    status_filter: Optional[str] = Query(None),
    priority_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_ticket_seeds(db, current_user.business_id)
    query = db.query(SupportTicket).filter(SupportTicket.business_id == current_user.business_id)
    
    if status_filter and status_filter != "All":
        query = query.filter(SupportTicket.status == status_filter)
    if priority_filter and priority_filter != "All":
        query = query.filter(SupportTicket.priority == priority_filter)
        
    tickets = query.order_by(SupportTicket.created_at.desc()).all()
    
    # Map back with human readable agent name
    response_items = []
    for t in tickets:
        agent_name = "Unassigned"
        if t.assigned_agent:
            agent_name = t.assigned_agent.name or t.assigned_agent.role
            
        item = {
            "id": t.id,
            "customer_name": t.customer_name,
            "customer_email": t.customer_email,
            "customer_phone": t.customer_phone,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "assigned_agent_id": t.assigned_agent_id,
            "assigned_agent_name": agent_name,
            "sla_deadline": t.sla_deadline,
            "sla_status": t.sla_status,
            "created_at": t.created_at,
            "updated_at": t.updated_at
        }
        response_items.append(item)
        
    return {"tickets": response_items}

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    title = payload.get("title")
    desc = payload.get("description")
    customer = payload.get("customer_name")
    
    if not title or not desc or not customer:
        raise HTTPException(status_code=400, detail="title, description, and customer_name are mandatory")
        
    ticket = SupportTicket(
        business_id=current_user.business_id,
        customer_name=customer,
        customer_email=payload.get("customer_email"),
        customer_phone=payload.get("customer_phone"),
        title=title,
        description=desc,
        priority=payload.get("priority", "Medium"),
        status="Open",
        sla_deadline=datetime.utcnow() + timedelta(hours=48) # Default 48 hr SLA
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Audit trail
    history = TicketHistory(
        ticket_id=ticket.id,
        changed_by=customer,
        action="Created",
        notes=f"New support ticket registered regarding {title}."
    )
    db.add(history)
    db.commit()
    
    return {"status": "success", "ticket_id": ticket.id}

@router.put("/{ticket_id}", response_model=Dict[str, Any])
def update_support_ticket(
    ticket_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.business_id == current_user.business_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")
        
    audit_notes = []
    
    if "status" in payload:
        old_status = ticket.status
        new_status = payload["status"]
        if old_status != new_status:
            ticket.status = new_status
            audit_notes.append(f"Status changed from '{old_status}' to '{new_status}'")
            if new_status == "Resolved":
                ticket.sla_status = "Met"
            elif new_status == "Closed":
                ticket.sla_status = "Met" if ticket.sla_status != "Breached" else "Breached"
                
    if "priority" in payload:
        old_piv = ticket.priority
        new_piv = payload["priority"]
        if old_piv != new_piv:
            ticket.priority = new_piv
            audit_notes.append(f"Priority reassessed from '{old_piv}' to '{new_piv}'")
            
    if "assigned_agent_id" in payload:
        old_agent_id = ticket.assigned_agent_id
        new_agent_id = payload["assigned_agent_id"]
        if old_agent_id != new_agent_id:
            agent_text = "Unassigned"
            if new_agent_id:
                agent = db.query(TeamMember).filter(
                    TeamMember.id == new_agent_id,
                    TeamMember.business_id == current_user.business_id
                ).first()
                if not agent:
                    raise HTTPException(status_code=404, detail="Support agent not found")
                agent_text = agent.name or agent.role
            ticket.assigned_agent_id = new_agent_id
            audit_notes.append(f"Agent reassigned to: {agent_text}")
            
    if audit_notes:
        ticket.updated_at = datetime.utcnow()
        db.commit()
        
        # Insert log history audit trial
        history = TicketHistory(
            ticket_id=ticket.id,
            changed_by=current_user.name or "Manager Desk",
            action="Update",
            notes="; ".join(audit_notes)
        )
        db.add(history)
        db.commit()
        
    return {"status": "success"}

@router.get("/{ticket_id}/history", response_model=Dict[str, Any])
def get_ticket_history(
    ticket_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify ticket exists and belongs to organization
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.business_id == current_user.business_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")
        
    history = db.query(TicketHistory).filter(TicketHistory.ticket_id == ticket_id).order_by(TicketHistory.created_at.desc()).all()
    return {"history": history}

@router.get("/analytics", response_model=Dict[str, Any])
def get_ticket_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_ticket_seeds(db, current_user.business_id)
    tickets = db.query(SupportTicket).filter(SupportTicket.business_id == current_user.business_id).all()
    
    total = len(tickets)
    open_count = sum([1 for t in tickets if t.status == "Open"])
    pending_count = sum([1 for t in tickets if t.status == "Pending"])
    resolved_count = sum([1 for t in tickets if t.status == "Resolved"])
    closed_count = sum([1 for t in tickets if t.status == "Closed"])
    
    sla_breached = sum([1 for t in tickets if t.sla_status == "Breached"])
    sla_met = sum([1 for t in tickets if t.sla_status == "Met" or t.status in ["Resolved", "Closed"] and t.sla_status != "Breached"])
    
    return {
        "total_tickets": total,
        "open_tickets": open_count,
        "pending_tickets": pending_count,
        "resolved_tickets": resolved_count,
        "closed_tickets": closed_count,
        "sla_compliance": {
            "met": sla_met,
            "breached": sla_breached
        }
    }
