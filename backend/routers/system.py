from typing import Dict, Any, List, Optional
from datetime import datetime
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


# ─── Deep Multi-System Enterprise Health Check ───────────────────

@router.get("/health-deep")
def get_deep_health_check(db: Session = Depends(get_db)):
    """
    Runs multi-subsystem diagnostics across Database, Background Queues,
    Gemini AI, WhatsApp, and Payment Gateway.
    """
    import os
    import time
    from sqlalchemy import text

    subsystems: Dict[str, Any] = {}
    overall_status = "healthy"

    # 1. Database Connectivity & Roundtrip Latency
    db_start = time.time()
    try:
        db.execute(text("SELECT 1")).scalar()
        db_latency_ms = round((time.time() - db_start) * 1000, 2)
        subsystems["database"] = {
            "status": "healthy",
            "latency_ms": db_latency_ms
        }
    except Exception as exc:
        overall_status = "degraded"
        subsystems["database"] = {
            "status": "unhealthy",
            "error": str(exc)
        }

    # 2. Background Queue & DLQ
    queue_stats = JobQueueService.get_queue_stats()
    subsystems["background_queue"] = {
        "status": "healthy" if queue_stats["is_running"] else "stopped",
        "active_workers": queue_stats["active_workers"],
        "dlq_count": queue_stats["dlq_count"],
        "queue_depth": queue_stats["queue_depth"]
    }

    # 3. Gemini AI Configuration
    gemini_key = os.environ.get("GEMINI_API_KEY")
    subsystems["gemini_ai"] = {
        "status": "configured" if gemini_key else "mock_mode",
        "model": "gemini-3.5-flash"
    }

    # 4. WhatsApp Cloud API Configuration
    wa_token = os.environ.get("WHATSAPP_TOKEN") or getattr(settings, "WHATSAPP_TOKEN", None)
    subsystems["whatsapp_cloud_api"] = {
        "status": "configured" if wa_token else "development_mock_mode"
    }

    # 5. Payment Gateway Configuration
    rzp_key = os.environ.get("RAZORPAY_KEY_ID")
    subsystems["payment_gateway"] = {
        "status": "configured" if rzp_key else "development_mock_mode"
    }

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "subsystems": subsystems
    }

