import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models.activity_log import ActivityLog
from models.user import User

logger = logging.getLogger("autofy_activity_logger")

class ActivityService:
    @classmethod
    def log(
        cls,
        db: Session,
        business_id: str,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        details: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        user: Optional[User] = None,
        ip_address: Optional[str] = None
    ) -> ActivityLog:
        """
        Creates an audit trail record for sensitive business operations.
        """
        try:
            log_entry = ActivityLog(
                business_id=business_id,
                user_id=user.id if user else None,
                user_name=user.name if user else "System/Automated",
                user_role=user.role if user else "System",
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details,
                metadata_json=json.dumps(metadata) if metadata else None,
                ip_address=ip_address,
                created_at=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            return log_entry
        except Exception as e:
            logger.error(f"Failed to write activity audit log: {e}")
            db.rollback()
            return None
