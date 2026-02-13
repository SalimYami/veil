"""
Token Repository - Data access layer for refresh token operations.
Handles all database interactions for JWT refresh token management.
"""

import logging
from typing import List
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database.models import RefreshToken

logger = logging.getLogger("veil.repositories.token")

# Password context for hashing tokens
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenRepository:
    """Repository for refresh token database operations."""
    
    @staticmethod
    def store_refresh_token(
        db: Session,
        user_id: str,
        token: str,
        expires_at: datetime
    ) -> RefreshToken:
        """
        Store a refresh token (hashed).
        
        Args:
            db: Database session
            user_id: User UUID
            token: Refresh token (will be hashed)
            expires_at: Expiration timestamp
        
        Returns:
            Created RefreshToken object
        """
        token_hash = pwd_context.hash(token)
        
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        
        db.add(refresh_token)
        db.flush()
        
        # Limit to 5 tokens per user (multi-device support)
        TokenRepository._cleanup_old_user_tokens(db, user_id, keep_count=5)
        
        logger.info(f"Refresh token stored for user {user_id}")
        return refresh_token
    
    @staticmethod
    def verify_refresh_token(db: Session, user_id: str, token: str) -> bool:
        """
        Verify if a refresh token is valid.
        
        Args:
            db: Database session
            user_id: User UUID
            token: Refresh token to verify
        
        Returns:
            True if token is valid and not expired, False otherwise
        """
        # Get all non-expired tokens for user
        tokens = db.query(RefreshToken)\
            .filter(RefreshToken.user_id == user_id)\
            .filter(RefreshToken.expires_at > datetime.utcnow())\
            .all()
        
        # Check if any token matches
        for stored_token in tokens:
            if pwd_context.verify(token, stored_token.token_hash):
                logger.info(f"Refresh token verified for user {user_id}")
                return True
        
        logger.warning(f"Invalid refresh token for user {user_id}")
        return False
    
    @staticmethod
    def revoke_user_tokens(db: Session, user_id: str) -> int:
        """
        Revoke all refresh tokens for a user.
        
        Args:
            db: Database session
            user_id: User UUID
        
        Returns:
            Number of tokens revoked
        """
        count = db.query(RefreshToken)\
            .filter(RefreshToken.user_id == user_id)\
            .delete()
        
        db.flush()
        
        logger.info(f"Revoked {count} refresh tokens for user {user_id}")
        return count
    
    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        """
        Delete all expired refresh tokens.
        
        Args:
            db: Database session
        
        Returns:
            Number of tokens deleted
        """
        count = db.query(RefreshToken)\
            .filter(RefreshToken.expires_at < datetime.utcnow())\
            .delete()
        
        db.flush()
        
        if count > 0:
            logger.info(f"Cleaned up {count} expired refresh tokens")
        
        return count
    
    @staticmethod
    def _cleanup_old_user_tokens(db: Session, user_id: str, keep_count: int = 5) -> None:
        """
        Keep only the N most recent tokens for a user.
        
        Args:
            db: Database session
            user_id: User UUID
            keep_count: Number of tokens to keep
        """
        # Get all tokens for user, ordered by creation date
        tokens = db.query(RefreshToken)\
            .filter(RefreshToken.user_id == user_id)\
            .order_by(RefreshToken.created_at.desc())\
            .all()
        
        # Delete old tokens if more than keep_count
        if len(tokens) > keep_count:
            tokens_to_delete = tokens[keep_count:]
            for token in tokens_to_delete:
                db.delete(token)
            
            db.flush()
            logger.info(f"Cleaned up {len(tokens_to_delete)} old tokens for user {user_id}")
