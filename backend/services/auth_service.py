"""
Authentication Service - Business logic for user authentication.
Handles registration, login, token refresh, and role management.
"""

import logging
import uuid
from datetime import datetime, timedelta

from passlib.context import CryptContext
from jose import JWTError, jwt

from database.connection import get_db
from repositories.user_repository import UserRepository
from repositories.token_repository import TokenRepository

logger = logging.getLogger("veil.services.auth")

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations."""
    
    def __init__(
        self,
        secret_key: str,
        refresh_secret_key: str,
        algorithm: str = "HS256",
        access_token_expire_minutes: int = 15,
        refresh_token_expire_days: int = 7
    ):
        """
        Initialize authentication service.
        
        Args:
            secret_key: Secret key for access tokens
            refresh_secret_key: Secret key for refresh tokens
            algorithm: JWT algorithm
            access_token_expire_minutes: Access token lifetime
            refresh_token_expire_days: Refresh token lifetime
        """
        self.secret_key = secret_key
        self.refresh_secret_key = refresh_secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days
    
    def register_user(self, email: str, auth_hash: str) -> dict:
        """
        Register a new user.
        
        Args:
            email: User email
            auth_hash: Client-derived auth hash (SHA256 of authKey)
        
        Returns:
            dict with access_token, refresh_token, user_id, role, expires_in
        
        Raises:
            ValueError: If email already exists
        """
        with get_db() as db:
            # Check if user exists
            if UserRepository.user_exists(db, email):
                raise ValueError("Email already registered")
            
            # Hash the auth_hash with bcrypt (double hashing)
            hashed_auth_hash = pwd_context.hash(auth_hash)
            
            # Create user
            user = UserRepository.create_user(db, email, hashed_auth_hash, role="user")
            
            # Generate tokens
            access_token = self._create_access_token(user.id)
            refresh_token = self._create_refresh_token(user.id)
            
            # Store refresh token
            expires_at = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
            TokenRepository.store_refresh_token(db, user.id, refresh_token, expires_at)
            
            logger.info(f"User registered: {email}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user_id": str(user.id),
                "role": user.role,
                "expires_in": self.access_token_expire_minutes * 60
            }
    
    def login_user(self, email: str, auth_hash: str) -> dict:
        """
        Authenticate user and generate tokens.
        
        Args:
            email: User email
            auth_hash: Client-derived auth hash
        
        Returns:
            dict with access_token, refresh_token, user_id, role, expires_in
        
        Raises:
            ValueError: If credentials are invalid
        """
        with get_db() as db:
            # Get user
            user = UserRepository.get_user_by_email(db, email)
            
            # Timing attack prevention: always verify hash even if user doesn't exist
            if user is None:
                dummy_hash = "$2b$12$dummyhashtopreventtimingattack1234567890123456789012"
                pwd_context.verify(auth_hash, dummy_hash)
                raise ValueError("Invalid credentials")
            
            # Verify auth_hash
            if not pwd_context.verify(auth_hash, user.auth_hash):
                raise ValueError("Invalid credentials")
            
            # Generate tokens
            access_token = self._create_access_token(user.id)
            refresh_token = self._create_refresh_token(user.id)
            
            # Store refresh token
            expires_at = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
            TokenRepository.store_refresh_token(db, user.id, refresh_token, expires_at)
            
            logger.info(f"User logged in: {email}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user_id": str(user.id),
                "role": user.role,
                "expires_in": self.access_token_expire_minutes * 60
            }
    
    def refresh_access_token(self, refresh_token: str) -> dict:
        """
        Generate new access token from refresh token.
        
        Args:
            refresh_token: Valid refresh token
        
        Returns:
            dict with new access_token, same refresh_token, user_id, role, expires_in
        
        Raises:
            ValueError: If refresh token is invalid or expired
        """
        try:
            # Decode refresh token
            payload = jwt.decode(
                refresh_token,
                self.refresh_secret_key,
                algorithms=[self.algorithm]
            )
            
            # Verify token type
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")
            
            user_id = payload.get("sub")
            if not user_id:
                raise ValueError("Invalid token")
            
            with get_db() as db:
                # Verify token is in database and not revoked
                if not TokenRepository.verify_refresh_token(db, user_id, refresh_token):
                    raise ValueError("Token revoked or invalid")
                
                # Get user
                user = UserRepository.get_user_by_id(db, user_id)
                if not user:
                    raise ValueError("User not found")
                
                # Generate new access token
                new_access_token = self._create_access_token(user.id)
                
                logger.info(f"Access token refreshed for user {user_id}")
                
                return {
                    "access_token": new_access_token,
                    "refresh_token": refresh_token,  # Keep same refresh token
                    "token_type": "bearer",
                    "user_id": user.id,
                    "role": user.role,
                    "expires_in": self.access_token_expire_minutes * 60
                }
        
        except JWTError as e:
            logger.warning(f"Invalid refresh token: {str(e)}")
            raise ValueError("Invalid or expired refresh token")
    
    def logout_user(self, user_id: str) -> None:
        """
        Revoke all refresh tokens for a user.
        
        Args:
            user_id: User UUID
        """
        with get_db() as db:
            count = TokenRepository.revoke_user_tokens(db, user_id)
            logger.info(f"User logged out: {user_id} ({count} tokens revoked)")
    
    def promote_to_admin(self, user_id: str, secret_key: str, admin_key: str) -> bool:
        """
        Promote user to admin role.
        
        Args:
            user_id: User UUID
            secret_key: Secret key provided by user
            admin_key: Expected admin secret key
        
        Returns:
            True if promoted successfully
        
        Raises:
            ValueError: If secret key is invalid
        """
        if secret_key != admin_key:
            raise ValueError("Invalid admin secret key")
        
        with get_db() as db:
            success = UserRepository.update_user_role(db, user_id, "admin")
            if success:
                logger.info(f"User promoted to admin: {user_id}")
            return success
    
    def _create_access_token(self, user_id: uuid.UUID) -> str:
        """Create access token JWT."""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def _create_refresh_token(self, user_id: uuid.UUID) -> str:
        """Create refresh token JWT."""
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        return jwt.encode(to_encode, self.refresh_secret_key, algorithm=self.algorithm)
