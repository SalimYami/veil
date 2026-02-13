"""
Activity Repository - Data access layer for activity logging.
Handles all database interactions for user activity tracking.
"""

import logging
from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from database.models import ActivityLog

logger = logging.getLogger("veil.repositories.activity")


class ActivityRepository:
    """Repository for activity log database operations."""
    
    @staticmethod
    def log_activity(
        db: Session,
        user_id: str,
        action: str,
        file_name: str,
        file_id: Optional[str] = None,
        details: str = ""
    ) -> ActivityLog:
        """
        Log a user activity.
        
        Args:
            db: Database session
            user_id: User UUID
            action: Action type ('upload', 'download', 'delete', 'tag')
            file_name: File name
            file_id: File UUID (optional)
            details: Additional details
        
        Returns:
            Created ActivityLog object
        """
        activity = ActivityLog(
            user_id=user_id,
            action=action,
            file_id=file_id,
            file_name=file_name,
            details=details,
            timestamp=datetime.utcnow()
        )
        
        db.add(activity)
        db.flush()
        
        return activity
    
    @staticmethod
    def get_user_activity(
        db: Session,
        user_id: str,
        limit: int = 100
    ) -> List[ActivityLog]:
        """
        Get user activity history.
        
        Args:
            db: Database session
            user_id: User UUID
            limit: Maximum number of entries
        
        Returns:
            List of ActivityLog objects
        """
        return db.query(ActivityLog)\
            .filter(ActivityLog.user_id == user_id)\
            .order_by(ActivityLog.timestamp.desc())\
            .limit(limit)\
            .all()
