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
    # No-op: Do not auto-seed fake logs or knowledge gaps for production accounts
    pass

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
