from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from database import get_db
from models.user import User
from models.team_member import TeamMember
from models.activity_log import ActivityLog
from auth.dependencies import get_current_active_user, RoleChecker
from services.activity_services import ActivityService

router = APIRouter(prefix="/team", tags=["Enterprise Team & Permissions"])

# ─── RBAC Role & Permission Definitions ──────────────────────────

VALID_ROLES = ["Owner", "Admin", "Support Agent", "Sales Agent", "Accountant"]

ROLE_PERMISSIONS_MATRIX: Dict[str, Dict[str, bool]] = {
    "Owner": {
        "can_edit_pricing": True,
        "can_reply_chats": True,
        "can_manage_payments": True,
        "can_export_data": True,
        "can_change_whatsapp": True,
        "can_manage_team": True,
        "can_delete_account": True,
    },
    "Admin": {
        "can_edit_pricing": True,
        "can_reply_chats": True,
        "can_manage_payments": True,
        "can_export_data": True,
        "can_change_whatsapp": True,
        "can_manage_team": True,
        "can_delete_account": False,
    },
    "Support Agent": {
        "can_edit_pricing": False,
        "can_reply_chats": True,
        "can_manage_payments": False,
        "can_export_data": False,
        "can_change_whatsapp": False,
        "can_manage_team": False,
        "can_delete_account": False,
    },
    "Sales Agent": {
        "can_edit_pricing": False,
        "can_reply_chats": True,
        "can_manage_payments": False,
        "can_export_data": False,
        "can_change_whatsapp": False,
        "can_manage_team": False,
        "can_delete_account": False,
    },
    "Accountant": {
        "can_edit_pricing": False,
        "can_reply_chats": False,
        "can_manage_payments": True,
        "can_export_data": True,
        "can_change_whatsapp": False,
        "can_manage_team": False,
        "can_delete_account": False,
    }
}

# ─── Schemas ──────────────────────────────────────────────────────

class TeamInviteSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = Field("Support Agent", description="Owner, Admin, Support Agent, Sales Agent, Accountant")

class TeamMemberUpdateSchema(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None # Active, Pending, Inactive

class TeamMemberResponseSchema(BaseModel):
    id: str
    business_id: str
    name: str
    email: str
    role: str
    status: str
    created_at: Optional[datetime] = None

class ActivityLogResponseSchema(BaseModel):
    id: str
    business_id: str
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/members", response_model=List[TeamMemberResponseSchema])
@router.get("", response_model=List[TeamMemberResponseSchema])
def list_team_members(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of all enterprise team members associated with the business.
    """
    members = db.query(TeamMember).filter(TeamMember.business_id == current_user.business_id).all()
    return members


@router.get("/permissions/me")
def get_my_permissions(
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns the resolved RBAC permissions and capabilities for the current user session.
    """
    role = current_user.role or "Support Agent"
    perms = ROLE_PERMISSIONS_MATRIX.get(role, ROLE_PERMISSIONS_MATRIX["Support Agent"])
    return {
        "user_id": current_user.id,
        "user_name": current_user.name,
        "role": role,
        "permissions": perms
    }


@router.get("/permissions/matrix")
def get_role_permissions_matrix():
    """
    Returns the system-wide RBAC role permissions matrix.
    """
    return {
        "roles": VALID_ROLES,
        "matrix": ROLE_PERMISSIONS_MATRIX
    }


@router.post("/invite", response_model=TeamMemberResponseSchema, status_code=status.HTTP_201_CREATED)
def invite_teammate(
    payload: TeamInviteSchema,
    request: Request,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Invites a new enterprise teammate with a designated RBAC role.
    Restricted to Owners and Admins.
    """
    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role must be one of: {', '.join(VALID_ROLES)}"
        )

    # Check for duplicate
    existing = db.query(TeamMember).filter(
        TeamMember.business_id == current_user.business_id,
        TeamMember.email == payload.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A team member with this email already exists."
        )

    new_member = TeamMember(
        business_id=current_user.business_id,
        name=payload.name.strip(),
        email=str(payload.email).lower().strip(),
        role=payload.role,
        status="Active"
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    # Audit log
    ActivityService.log(
        db=db,
        business_id=current_user.business_id,
        action="TEAM_MEMBER_INVITED",
        entity_type="TeamMember",
        entity_id=new_member.id,
        details=f"Invited {new_member.name} ({new_member.email}) as {new_member.role}",
        user=current_user,
        ip_address=request.client.host if request.client else None
    )

    return new_member


@router.patch("/members/{member_id}", response_model=TeamMemberResponseSchema)
def update_team_member(
    member_id: str,
    payload: TeamMemberUpdateSchema,
    request: Request,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Updates role or activation status of a team member.
    """
    member = db.query(TeamMember).filter(
        TeamMember.id == member_id,
        TeamMember.business_id == current_user.business_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Team member not found.")

    if payload.role:
        if payload.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
        member.role = payload.role

    if payload.status:
        member.status = payload.status

    if payload.name:
        member.name = payload.name.strip()

    db.commit()
    db.refresh(member)

    ActivityService.log(
        db=db,
        business_id=current_user.business_id,
        action="TEAM_MEMBER_UPDATED",
        entity_type="TeamMember",
        entity_id=member.id,
        details=f"Updated team member {member.name} (Role: {member.role}, Status: {member.status})",
        user=current_user,
        ip_address=request.client.host if request.client else None
    )

    return member


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_teammate_access(
    member_id: str,
    request: Request,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Revokes access and deletes a team member. Restricted to Owners and Admins.
    """
    member = db.query(TeamMember).filter(
        TeamMember.id == member_id,
        TeamMember.business_id == current_user.business_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Team member not found.")

    member_name = member.name
    member_email = member.email
    db.delete(member)
    db.commit()

    ActivityService.log(
        db=db,
        business_id=current_user.business_id,
        action="TEAM_MEMBER_REVOKED",
        entity_type="TeamMember",
        entity_id=member_id,
        details=f"Revoked access for {member_name} ({member_email})",
        user=current_user,
        ip_address=request.client.host if request.client else None
    )


# ─── Activity Log Audit Trail ────────────────────────────────────

@router.get("/activity-logs", response_model=List[ActivityLogResponseSchema])
def get_team_activity_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None, description="Filter by action keyword"),
    current_user: User = Depends(RoleChecker(["Owner", "Admin", "Accountant"])),
    db: Session = Depends(get_db)
):
    """
    Returns enterprise audit trail logs of administrative, financial, and operational activities.
    """
    query = db.query(ActivityLog).filter(ActivityLog.business_id == current_user.business_id)
    if action:
        query = query.filter(ActivityLog.action.ilike(f"%{action}%"))
    logs = query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return logs
