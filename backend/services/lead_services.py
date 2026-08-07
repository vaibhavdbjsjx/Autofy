import logging
from typing import List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session
from models.lead import Lead
from schemas.leads import LeadCreate, LeadUpdate

logger = logging.getLogger("autofy_lead_services")

def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    # Strip all non-digit characters
    cleaned = "".join(c for c in phone if c.isdigit())
    if not cleaned:
        return None
    return cleaned

class LeadCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: LeadCreate) -> Lead:
        db_obj = Lead(
            business_id=business_id,
            name=obj_in.name,
            email=obj_in.email,
            phone=obj_in.phone,
            status=obj_in.status,
            source=obj_in.source,
            score=obj_in.score,
            notes=obj_in.notes
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Run automatic initial lead scoring
        LeadCRUD.recalculate_score(db, db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, lead_id: str) -> Optional[Lead]:
        return db.query(Lead).filter(
            Lead.id == lead_id, 
            Lead.business_id == business_id
        ).first()

    @staticmethod
    def get_by_phone(db: Session, business_id: str, phone: str) -> Optional[Lead]:
        if not phone:
            return None
        # First try exact query match
        exact = db.query(Lead).filter(
            Lead.phone == phone,
            Lead.business_id == business_id
        ).first()
        if exact:
            return exact

        # Normalized match comparison
        target_norm = normalize_phone(phone)
        if not target_norm:
            return None

        leads = db.query(Lead).filter(Lead.business_id == business_id).all()
        for lead in leads:
            if lead.phone and normalize_phone(lead.phone) == target_norm:
                return lead
        return None

    @staticmethod
    def list_paginated(
        db: Session, 
        business_id: str, 
        skip: int = 0, 
        limit: int = 20, 
        search: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        min_score: Optional[int] = None,
        max_score: Optional[int] = None
    ) -> Tuple[List[Lead], int]:
        query = db.query(Lead).filter(Lead.business_id == business_id)

        # Filters
        if status:
            query = query.filter(Lead.status == status)
        if source:
            query = query.filter(Lead.source == source)
        if min_score is not None:
            query = query.filter(Lead.score >= min_score)
        if max_score is not None:
            query = query.filter(Lead.score <= max_score)
            
        # Global Search across multiple fields
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Lead.name.ilike(search_pattern),
                    Lead.email.ilike(search_pattern),
                    Lead.phone.ilike(search_pattern),
                    Lead.notes.ilike(search_pattern)
                )
            )

        total_count = query.count()
        results = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
        return results, total_count

    @staticmethod
    def update(db: Session, business_id: str, lead_id: str, obj_in: LeadUpdate) -> Optional[Lead]:
        db_obj = LeadCRUD.get_by_id(db, business_id, lead_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        
        # Recalculate lead score based on updated profile criteria
        LeadCRUD.recalculate_score(db, db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, lead_id: str) -> bool:
        db_obj = LeadCRUD.get_by_id(db, business_id, lead_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def recalculate_score(db: Session, lead: Lead) -> Tuple[int, List[str]]:
        """
        Dynamically calculates a lead's qualification score.
        Criteria:
        - Has Name: +15
        - Has Email: +20
        - Has Phone: +20
        - High-value Source (e.g. Inbound Web, WhatsApp Referral): +10
        - Detailed Info / Description contains positive buying signals or intent words:
          e.g. "price", "buy", "join", "sign", "cost", "membership", "quote", "interested": +25
        - Multi-message engagement status: +10
        """
        score = 10 # Base starting score
        reasons = ["Base Score Applied (+10)"]

        if lead.name and "Unnamed" not in lead.name:
            score += 15
            reasons.append("Contact Name Provided (+15)")
            
        if lead.email:
            score += 20
            reasons.append("Email Contact Verified (+20)")
            
        if lead.phone:
            score += 20
            reasons.append("Phone Line Registered (+20)")

        if lead.source in ["Web", "API", "Referral"]:
            score += 10
            reasons.append(f"High conversion source: {lead.source} (+10)")

        # Buying intent search in notes & fields
        intent_signals = ["price", "buy", "join", "sign", "cost", "membership", "quote", "interested", "service", "product", "book"]
        notes_text = lead.notes.lower() if lead.notes else ""
        text_to_scan = f"{notes_text} {lead.name.lower() if lead.name else ''}"
        
        matched_signals = [sig for sig in intent_signals if sig in text_to_scan]
        if matched_signals:
            bonus = min(25, len(matched_signals) * 10)
            score += bonus
            reasons.append(f"Buying signals detected in communications: {', '.join(matched_signals)} (+{bonus})")

        # Update and save score
        lead.score = score
        db.commit()
        db.refresh(lead)

        return score, reasons
