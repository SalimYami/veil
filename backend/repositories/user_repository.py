"""
User Repository - Data access layer for user operations.
Handles all database interactions for user management.
"""

import logging
from typing import Optional, Any
from datetime import datetime, UTC

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database.models import User

logger = logging.getLogger("veil.repositories.user")


class UserRepository:
    """Repository for user database operations."""
    
    @staticmethod
    def create_user(db: Session, email: str, auth_hash: str, role: str = "user") -> User:
        """
        Create a new user.
        
        Args:
            db: Database session
            email: User email (must be unique)
            auth_hash: bcrypt hash of client-derived authKey
            role: User role ('user' or 'admin')
        
        Returns:
            Created User object
        
        Raises:
            IntegrityError: If email already exists
        """
        user = User(
            email=email,
            auth_hash=auth_hash,
            role=role
        )
        
        try:
            db.add(user)
            db.flush()  # Get the ID without committing
            logger.info(f"User created: {email} (ID: {user.id})")
            return user
        except IntegrityError as e:
            logger.warning(f"Failed to create user {email}: {str(e)}")
            raise
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            db: Database session
            email: User email
        
        Returns:
            User object or None if not found
        """
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: Any) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User UUID
        
        Returns:
            User object or None if not found
        """
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def update_user_role(db: Session, user_id: Any, role: str) -> bool:
        """
        Update user role.
        
        Args:
            db: Database session
            user_id: User UUID
            role: New role ('user' or 'admin')
        
        Returns:
            True if updated, False if user not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.role = role
        user.updated_at = datetime.now(UTC)
        db.flush()
        
        logger.info(f"User role updated: {user.email} -> {role}")
        return True
    
    @staticmethod
    def user_exists(db: Session, email: str) -> bool:
        """
        Check if user exists by email.
        
        Args:
            db: Database session
            email: User email
        
        Returns:
            True if user exists, False otherwise
        """
        return db.query(User).filter(User.email == email).count() > 0
