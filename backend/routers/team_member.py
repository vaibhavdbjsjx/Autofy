from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User
from models.team_member import TeamMember
from auth.dependencies import get_current_active_user, RoleChecker

router = APIRouter(prefix="/team", tags=["Team Members"])

# Operational Schemas
class TeamInviteSchema(BaseModel):
    name: str
    email: EmailStr
    role: str                       # Admin, Manager, Support Agent

class TeamMemberUpdateSchema(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None # Active, Pending, Inactive

class TeamMemberResponseSchema(BaseModel):
    id: str
    business_id: str
    name: str
    email: str
    role: str
    status: str

@router.get("/members", response_model=List[TeamMemberResponseSchema])
def list_team_members(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns lists of all corporate team members verified for the current business group.
    """
    members = db.query(TeamMember).filter(TeamMember.business_id == current_user.business_id).all()
    return members

@router.post("/invite", response_model=TeamMemberResponseSchema, status_code=status.HTTP_201_CREATED)
def invite_teammate(
    payload: TeamInviteSchema,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Creates a pending invitation record for a new corporate workspace assistant.
    Restricted to Owners and Admins only.
    """
    if payload.role not in ["Admin", "Manager", "Support Agent"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: Admin, Manager, Support Agent."
        )

    # Prevent duplicates inside the active business network
    existing = db.query(TeamMember).filter(
        TeamMember.business_id == current_user.business_id,
        TeamMember.email == payload.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A team invitation or account record already exists for this email."
        )

    new_member = TeamMember(
        business_id=current_user.business_id,
        name=payload.name,
        email=str(payload.email),
        role=payload.role,
        status="Pending"
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_teammate_access(
    member_id: str,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Revokes credentials and deactivates a team member segment.
    Restricted to Owners and Admins only.
    """
    member = db.query(TeamMember).filter(
        TeamMember.id == member_id,
        TeamMember.business_id == current_user.business_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teammate registry records not found."
        )

    if member.role == "Owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Workspace Owner parameters represent top-level identities and cannot be revoked."
        )

    db.delete(member)
    db.commit()
    return None
