"""
Database connection management using SQLAlchemy.
Provides connection pooling and session management.
"""

import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

logger = logging.getLogger("veil.database")

# SQLAlchemy base for ORM models
Base = declarative_base()

# Global engine and session factory
_engine = None
_SessionLocal = None


def init_db(database_url: str) -> None:
    """
    Initialize database connection pool.
    
    Args:
        database_url: PostgreSQL connection string
                     Format: postgresql://user:password@host:port/database
    """
    global _engine, _SessionLocal
    
    logger.info(f"Initializing database connection to {database_url.split('@')[-1]}")
    
    # Create engine with connection pooling
    _engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=10,  # Number of connections to maintain
        max_overflow=20,  # Additional connections when pool is full
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,  # Recycle connections after 1 hour
        echo=False  # Set to True for SQL query logging
    )
    
    # Create session factory
    _SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=_engine
    )
    
    logger.info("Database connection pool initialized successfully")


def get_engine():
    """Get the SQLAlchemy engine."""
    if _engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _engine


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.
    
    Usage:
        with get_db() as db:
            user = db.query(User).filter_by(email=email).first()
    
    Automatically commits on success and rolls back on error.
    """
    if _SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    db = _SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        db.close()


def health_check() -> bool:
    """
    Check database connectivity.
    
    Returns:
        True if database is accessible, False otherwise
    """
    try:
        with get_db() as db:
            db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False


def close_db() -> None:
    """Close all database connections (for graceful shutdown)."""
    global _engine
    if _engine:
        _engine.dispose()
        logger.info("Database connections closed")
