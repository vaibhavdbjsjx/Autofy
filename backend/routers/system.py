from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from auth.dependencies import get_current_active_user, RoleChecker
from services.queue_services import JobQueueService
from services.error_tracker import ErrorTracker
from middleware.rate_limiter import limiter_store
from config import settings

router = APIRouter(prefix="/system", tags=["High-Scale Operations & Diagnostics"])

# ─── Queue & Background Workers Telemetry ───────────────────────

@router.get("/queue/status")
def get_queue_status():
    """
    Returns live background queue telemetry, worker pool health, active depth, and total jobs processed.
    """
    return {
        "status": "healthy",
        "redis_enabled": settings.REDIS_ENABLED,
        "concurrency": settings.QUEUE_MAX_CONCURRENCY,
        "telemetry": JobQueueService.get_queue_stats()
    }


@router.get("/dlq", response_model=List[Dict[str, Any]])
def get_dead_letter_queue_jobs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(RoleChecker(["Owner", "Admin"]))
):
    """
    Lists failed jobs stored in the Dead Letter Queue (DLQ) for inspection.
    Restricted to Owners and Admins.
    """
    return JobQueueService.get_dlq_jobs(limit=limit)


@router.post("/dlq/{job_id}/retry")
async def retry_dead_letter_job(
    job_id: str,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"]))
):
    """
    Re-enqueues a failed job from the Dead Letter Queue for immediate execution.
    """
    success = await JobQueueService.retry_dlq_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="DLQ job ID not found.")
    return {"status": "success", "message": f"Job {job_id} re-enqueued for processing."}


@router.delete("/dlq")
def clear_dead_letter_queue(
    current_user: User = Depends(RoleChecker(["Owner", "Admin"]))
):
    """
    Clears all jobs currently in the Dead Letter Queue.
    """
    cleared = JobQueueService.clear_dlq()
    return {"status": "success", "cleared_count": cleared}


# ─── Error Tracking & Operational Metrics ───────────────────────

@router.get("/errors/summary")
def get_error_tracker_summary(
    current_user: User = Depends(RoleChecker(["Owner", "Admin"]))
):
    """
    Returns summarized operational error metrics and frequencies across categories and business tenants.
    """
    return ErrorTracker.get_error_summary()


@router.get("/errors/recent")
def get_recent_errors(
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = Query(None),
    current_user: User = Depends(RoleChecker(["Owner", "Admin"]))
):
    """
    Retrieves recent runtime error stack traces and tenant contexts.
    """
    return {
        "errors": ErrorTracker.get_recent_errors(limit=limit, category=category)
    }


# ─── Rate Limiting Diagnostics ───────────────────────────────────

@router.get("/rate-limits/status")
def get_rate_limiter_status():
    """
    Returns rate limiting configurations and active sliding window buckets.
    """
    return {
        "enabled": settings.RATE_LIMIT_ENABLED,
        "default_limit_per_minute": settings.RATE_LIMIT_DEFAULT_PER_MINUTE,
        "webhook_limit_per_minute": settings.RATE_LIMIT_WEBHOOK_PER_MINUTE,
        "active_keys_tracked": len(limiter_store._buckets)
    }
