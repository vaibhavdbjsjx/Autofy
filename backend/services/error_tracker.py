import logging
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional
from collections import deque

logger = logging.getLogger("autofy_error_tracker")

class ErrorEvent:
    def __init__(
        self,
        error_id: str,
        category: str,
        message: str,
        traceback_str: Optional[str] = None,
        business_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.error_id = error_id
        self.category = category
        self.message = message
        self.traceback_str = traceback_str
        self.business_id = business_id
        self.endpoint = endpoint
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_id": self.error_id,
            "category": self.category,
            "message": self.message,
            "traceback": self.traceback_str,
            "business_id": self.business_id,
            "endpoint": self.endpoint,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }


class ErrorTracker:
    """
    Centralized high-performance in-memory and telemetry error tracking
    for production multi-tenant operations. Retains rolling buffer of recent errors.
    """
    _errors: deque = deque(maxlen=500)
    _counts_by_category: Dict[str, int] = {}
    _counts_by_business: Dict[str, int] = {}

    @classmethod
    def record_error(
        cls,
        category: str,
        exception: Exception,
        business_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        import uuid
        error_id = f"err_{uuid.uuid4().hex[:12]}"
        tb_str = traceback.format_exc() if exception else None
        msg = str(exception) if exception else "Unknown system exception"

        event = ErrorEvent(
            error_id=error_id,
            category=category,
            message=msg,
            traceback_str=tb_str,
            business_id=business_id,
            endpoint=endpoint,
            metadata=metadata
        )

        cls._errors.appendleft(event)
        cls._counts_by_category[category] = cls._counts_by_category.get(category, 0) + 1
        if business_id:
            cls._counts_by_business[business_id] = cls._counts_by_business.get(business_id, 0) + 1

        logger.error(f"[ERROR TRACKER] [{category}] (Tenant: {business_id or 'global'}) {msg}")
        return error_id

    @classmethod
    def get_recent_errors(cls, limit: int = 50, category: Optional[str] = None, business_id: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for err in cls._errors:
            if category and err.category != category:
                continue
            if business_id and err.business_id != business_id:
                continue
            results.append(err.to_dict())
            if len(results) >= limit:
                break
        return results

    @classmethod
    def get_error_summary(cls) -> Dict[str, Any]:
        return {
            "total_recorded": len(cls._errors),
            "by_category": dict(cls._counts_by_category),
            "by_business": dict(cls._counts_by_business),
            "recent_count_last_hour": sum(1 for e in cls._errors)
        }
