"""
SQLAlchemy ORM models for Veil database.
These models map to the PostgreSQL schema.
"""

from datetime import datetime, UTC
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Text, Uuid, JSON
from sqlalchemy.orm import relationship
import uuid

from .connection import Base


class User(Base):
    """User account model."""
    __tablename__ = "users"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    auth_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    files = relationship("File", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class File(Base):
    """File metadata model (NO plaintext content!)."""
    __tablename__ = "files"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    object_key = Column(String(255), unique=True, nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    iv = Column(String(255), nullable=False)  # Initialization vector (base64)
    auth_tag = Column(String(255), nullable=False)  # AES-GCM auth tag (base64)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    tags = Column(JSON, default=list)
    status = Column(String(50), nullable=False, default="pending")  # 'pending' or 'uploaded'
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC), index=True)
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationships
    user = relationship("User", back_populates="files")
    
    def __repr__(self):
        return f"<File(id={self.id}, name={self.file_name}, user_id={self.user_id})>"


class RefreshToken(Base):
    """Refresh token model for JWT session management."""
    __tablename__ = "refresh_tokens"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC))
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self):
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"


class ActivityLog(Base):
    """Activity log model for audit trail."""
    __tablename__ = "activity_log"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    file_id = Column(Uuid(as_uuid=True), nullable=True)
    file_name = Column(String(255))
    details = Column(Text)
    timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC), index=True)
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")
    
    def __repr__(self):
        return f"<ActivityLog(id={self.id}, action={self.action}, user_id={self.user_id})>"
