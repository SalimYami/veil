"""
File Repository - Data access layer for file metadata operations.
Handles all database interactions for file management.
"""

import logging
from typing import Optional, List, Any
from datetime import datetime, UTC

from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models import File

logger = logging.getLogger("veil.repositories.file")


class FileRepository:
    """Repository for file metadata database operations."""
    
    @staticmethod
    def create_file_metadata(
        db: Session,
        user_id: str,
        object_key: str,
        file_name: str,
        iv: str,
        auth_tag: str,
        file_size: int,
        mime_type: Optional[str] = None,
        status: str = "pending"
    ) -> File:
        """
        Create file metadata entry.
        
        Args:
            db: Database session
            user_id: Owner user UUID
            object_key: MinIO object identifier
            file_name: Original filename
            iv: Initialization vector (base64)
            auth_tag: AES-GCM authentication tag (base64)
            file_size: File size in bytes
            mime_type: MIME type (optional)
            status: Upload status ('pending' or 'uploaded')
        
        Returns:
            Created File object
        """
        file_meta = File(
            user_id=user_id,
            object_key=object_key,
            file_name=file_name,
            iv=iv,
            auth_tag=auth_tag,
            file_size=file_size,
            mime_type=mime_type,
            status=status,
            tags=[]
        )
        
        db.add(file_meta)
        db.flush()
        
        logger.info(f"File metadata created: {file_name} (ID: {file_meta.id}, object_key: {object_key})")
        return file_meta
    
    @staticmethod
    def get_user_files(db: Session, user_id: Any) -> List[File]:
        """
        Get all files for a user.
        
        Args:
            db: Database session
            user_id: User UUID
        
        Returns:
            List of File objects
        """
        return db.query(File)\
            .filter(File.user_id == user_id)\
            .filter(File.status == "uploaded")\
            .order_by(File.created_at.desc())\
            .all()
    
    @staticmethod
    def get_file_by_id(db: Session, file_id: Any) -> Optional[File]:
        """
        Get file by ID.
        
        Args:
            db: Database session
            file_id: File UUID
        
        Returns:
            File object or None if not found
        """
        return db.query(File).filter(File.id == file_id).first()
    
    @staticmethod
    def get_file_by_object_key(db: Session, object_key: str) -> Optional[File]:
        """
        Get file by MinIO object key.
        
        Args:
            db: Database session
            object_key: MinIO object identifier
        
        Returns:
            File object or None if not found
        """
        return db.query(File).filter(File.object_key == object_key).first()
    
    @staticmethod
    def update_file_status(db: Session, file_id: str, status: str) -> bool:
        """
        Update file upload status.
        
        Args:
            db: Database session
            file_id: File UUID
            status: New status ('pending' or 'uploaded')
        
        Returns:
            True if updated, False if file not found
        """
        file_meta = db.query(File).filter(File.id == file_id).first()
        if not file_meta:
            return False
        
        file_meta.status = status
        file_meta.updated_at = datetime.now(UTC)
        db.flush()
        
        logger.info(f"File status updated: {file_meta.file_name} -> {status}")
        return True
    
    @staticmethod
    def update_file_tags(db: Session, file_id: str, tags: List[str]) -> bool:
        """
        Update file tags.
        
        Args:
            db: Database session
            file_id: File UUID
            tags: List of tag strings
        
        Returns:
            True if updated, False if file not found
        """
        file_meta = db.query(File).filter(File.id == file_id).first()
        if not file_meta:
            return False
        
        file_meta.tags = tags
        file_meta.updated_at = datetime.now(UTC)
        db.flush()
        
        logger.info(f"File tags updated: {file_meta.file_name} -> {tags}")
        return True
    
    @staticmethod
    def delete_file(db: Session, file_id: str) -> bool:
        """
        Delete file metadata.
        
        Args:
            db: Database session
            file_id: File UUID
        
        Returns:
            True if deleted, False if file not found
        """
        file_meta = db.query(File).filter(File.id == file_id).first()
        if not file_meta:
            return False
        
        file_name = file_meta.file_name
        db.delete(file_meta)
        db.flush()
        
        logger.info(f"File metadata deleted: {file_name} (ID: {file_id})")
        return True
    
    @staticmethod
    def search_files(db: Session, user_id: str, query: str, limit: int = 10) -> List[File]:
        """
        Search files by name.
        
        Args:
            db: Database session
            user_id: User UUID
            query: Search query
            limit: Maximum results
        
        Returns:
            List of matching File objects
        """
        if not query.strip():
            return []
        
        search_pattern = f"%{query.lower()}%"
        
        return db.query(File)\
            .filter(File.user_id == user_id)\
            .filter(File.status == "uploaded")\
            .filter(func.lower(File.file_name).like(search_pattern))\
            .order_by(File.created_at.desc())\
            .limit(limit)\
            .all()
    
    @staticmethod
    def count_user_files(db: Session, user_id: str) -> int:
        """
        Count total files for a user.
        
        Args:
            db: Database session
            user_id: User UUID
        
        Returns:
            Number of files
        """
        return db.query(File)\
            .filter(File.user_id == user_id)\
            .filter(File.status == "uploaded")\
            .count()
    
    @staticmethod
    def get_user_storage_size(db: Session, user_id: str) -> int:
        """
        Get total storage used by user.
        
        Args:
            db: Database session
            user_id: User UUID
        
        Returns:
            Total size in bytes
        """
        result = db.query(func.sum(File.file_size))\
            .filter(File.user_id == user_id)\
            .filter(File.status == "uploaded")\
            .scalar()
        
        return result or 0
