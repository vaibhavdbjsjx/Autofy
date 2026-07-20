from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user
from models.user import User
from models.ai_training import AILog, AIKnowledgeGap, AITrainedAnswer
from models.faq import FAQ
import uuid

router = APIRouter(prefix="/ai-training", tags=["AI Training Center"])

def ensure_ai_seeds(db: Session, business_id: str):
    # If no AI logs exist, seed a set of realistic logs
    log_count = db.query(AILog).filter(AILog.business_id == business_id).count()
    if log_count == 0:
        seed_logs = [
            AILog(
                business_id=business_id,
                user_query="Do you build custom titanium chambers for exhausts?",
                ai_response="I'm sorry, we only stock stainless steel single-core silencers listed in our inventory.",
                confidence=0.45,
                status="raw",
                is_failed_or_low_confidence=True
            ),
            AILog(
                business_id=business_id,
                user_query="Can I return my helmet if the size is too small?",
                ai_response="I don't have information on the refund policy of our shop. Let me check with our manager.",
                confidence=0.52,
                status="raw",
                is_failed_or_low_confidence=True
            ),
            AILog(
                business_id=business_id,
                user_query="What is the db level of Red Rooster for Meteor 350?",
                ai_response="The Red Rooster Exhaust is designed inside standard government-approved db limits.",
                confidence=0.88,
                status="reviewed",
                is_failed_or_low_confidence=False
            ),
            AILog(
                business_id=business_id,
                user_query="Are you open on Sundays for installation?",
                ai_response="Our support team is active from 9 AM to 6 PM Monday through Friday. I cannot confirm weekend installs.",
                confidence=0.38,
                status="raw",
                is_failed_or_low_confidence=True
            ),
        ]
        db.add_all(seed_logs)
        db.commit()

    # Seed knowledge gaps if empty
    gap_count = db.query(AIKnowledgeGap).filter(AIKnowledgeGap.business_id == business_id).count()
    if gap_count == 0:
        seed_gaps = [
            AIKnowledgeGap(
                business_id=business_id,
                topic="Custom Titanium Fabrication",
                unanswered_query="Do you build custom titanium chambers for exhausts?",
                hit_count=14,
                suggested_faq_question="Do you manufacture custom titanium exhaust pipes?",
                suggested_faq_answer="We specialize in premium stainless steel slip-ons but can arrange titanium custom works via advanced pre-orders. Contact our custom lab desk.",
                status="detected"
            ),
            AIKnowledgeGap(
                business_id=business_id,
                topic="Weekend Fitting Lab Hours",
                unanswered_query="Are you open on Sundays for installation?",
                hit_count=9,
                suggested_faq_question="Can I book custom exhaust fitting on weekends?",
                suggested_faq_answer="Our mechanic workshop operates 10:00 AM to 5:00 PM on Saturdays. Sundays are closed except by exclusive club appointments.",
                status="detected"
            ),
            AIKnowledgeGap(
                business_id=business_id,
                topic="International Customs Carrier Duties",
                unanswered_query="Do you ship to UAE and handle duty clearance?",
                hit_count=6,
                suggested_faq_question="Do you ship to international regions?",
                suggested_faq_answer="Yes, we support global shipping via DHL Express. Buyers are responsible for localized import customs clearances.",
                status="detected"
            )
        ]
        db.add_all(seed_gaps)
        db.commit()

@router.get("/logs", response_model=Dict[str, Any])
def get_ai_logs(
    status_filter: Optional[str] = Query(None),
    is_failed: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_ai_seeds(db, current_user.business_id)
    
    query = db.query(AILog).filter(AILog.business_id == current_user.business_id)
    if status_filter:
        query = query.filter(AILog.status == status_filter)
    if is_failed is not None:
        query = query.filter(AILog.is_failed_or_low_confidence == is_failed)
        
    logs = query.order_by(AILog.created_at.desc()).all()
    return {"logs": logs}

@router.post("/logs/{log_id}/correct", response_model=Dict[str, Any])
def correct_ai_log(
    log_id: str,
    payload: Dict[str, str],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    log = db.query(AILog).filter(AILog.id == log_id, AILog.business_id == current_user.business_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="AI log entry not found")
        
    corrected_val = payload.get("corrected_response", "")
    if not corrected_val:
        raise HTTPException(status_code=400, detail="Missing corrected_response parameter")
        
    log.corrected_response = corrected_val
    log.status = "corrected"
    log.is_failed_or_low_confidence = False
    
    # Also optionally add it directly to standard FAQ or Trained answers pool to train the AI!
    trained = AITrainedAnswer(
        business_id=current_user.business_id,
        trigger_phrase=log.user_query,
        trained_response=corrected_val,
        status="active"
    )
    db.add(trained)
    db.commit()
    db.refresh(log)
    
    return {"status": "success", "log": log}

@router.get("/knowledge-gaps", response_model=Dict[str, Any])
def get_knowledge_gaps(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ensure_ai_seeds(db, current_user.business_id)
    gaps = db.query(AIKnowledgeGap).filter(AIKnowledgeGap.business_id == current_user.business_id).all()
    return {"gaps": gaps}

@router.post("/knowledge-gaps/{gap_id}/convert-to-faq", response_model=Dict[str, Any])
def convert_gap_to_faq(
    gap_id: str,
    payload: Dict[str, str],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    gap = db.query(AIKnowledgeGap).filter(AIKnowledgeGap.id == gap_id, AIKnowledgeGap.business_id == current_user.business_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Knowledge gap description not found")
        
    question = payload.get("question", gap.suggested_faq_question)
    answer = payload.get("answer", gap.suggested_faq_answer)
    
    # Write to static FAQs table
    faq = FAQ(
        business_id=current_user.business_id,
        question=question,
        answer=answer
    )
    db.add(faq)
    
    # Update gaps table
    gap.status = "trained"
    db.commit()
    
    return {"status": "success", "faq_id": faq.id}

@router.get("/trained-answers", response_model=Dict[str, Any])
def get_trained_answers(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    answers = db.query(AITrainedAnswer).filter(AITrainedAnswer.business_id == current_user.business_id).order_by(AITrainedAnswer.created_at.desc()).all()
    return {"trained_answers": answers}

@router.post("/trained-answers", response_model=Dict[str, Any])
def add_trained_answer(
    payload: Dict[str, str],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    trigger = payload.get("trigger_phrase", "").strip()
    response = payload.get("trained_response", "").strip()
    
    if not trigger or not response:
        raise HTTPException(status_code=400, detail="trigger_phrase and trained_response are required")
        
    answer = AITrainedAnswer(
        business_id=current_user.business_id,
        trigger_phrase=trigger,
        trained_response=response,
        status="active"
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return {"status": "success", "trained_answer": answer}

@router.delete("/trained-answers/{answer_id}", response_model=Dict[str, Any])
def delete_trained_answer(
    answer_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    ans = db.query(AITrainedAnswer).filter(AITrainedAnswer.id == answer_id, AITrainedAnswer.business_id == current_user.business_id).first()
    if not ans:
        raise HTTPException(status_code=404, detail="Trained rule not found")
    db.delete(ans)
    db.commit()
    return {"status": "success"}

@router.get("/analytics", response_model=Dict[str, Any])
def get_ai_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Calculate some dynamic key stats
    total_queries = db.query(AILog).filter(AILog.business_id == current_user.business_id).count()
    low_confidence = db.query(AILog).filter(AILog.business_id == current_user.business_id, AILog.is_failed_or_low_confidence == True).count()
    corrected_count = db.query(AILog).filter(AILog.business_id == current_user.business_id, AILog.status == "corrected").count()
    
    # Safe guard division by zero
    avg_confidence = 0.82
    if total_queries > 0:
        logs = db.query(AILog).filter(AILog.business_id == current_user.business_id).all()
        avg_confidence = sum([l.confidence for l in logs]) / len(logs)
        
    # Get top knowledge gaps by hits
    gaps = db.query(AIKnowledgeGap).filter(
        AIKnowledgeGap.business_id == current_user.business_id
    ).order_by(AIKnowledgeGap.hit_count.desc()).all()
    
    most_failed = [
        {"id": g.id, "question": g.unanswered_query, "hits": g.hit_count, "topic": g.topic}
        for g in gaps
    ]
    
    return {
        "total_queries": total_queries,
        "low_confidence_count": low_confidence,
        "corrected_count": corrected_count,
        "average_confidence": round(avg_confidence, 2),
        "most_failed": most_failed[:5]
    }
