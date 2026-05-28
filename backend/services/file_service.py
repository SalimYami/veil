"""
File Service - Business logic for file management.
Handles file upload/download orchestration with MinIO presigned URLs.
"""

import logging
import uuid
from typing import Optional

from database.connection import get_db
from repositories.file_repository import FileRepository
from repositories.activity_repository import ActivityRepository
from storage.minio_client import MinIOClient

logger = logging.getLogger("veil.services.file")


class FileService:
    """Service for file operations with MinIO presigned URLs."""
    
    def __init__(
        self,
        minio_client: MinIOClient,
        minio_client_external: MinIOClient,
        bucket_name: str,
        max_files_per_user: int = 1000
    ):
        """
        Initialize file service.
        
        Args:
            minio_client: MinIO client instance for internal operations
            minio_client_external: MinIO client instance for external presigned URLs
            bucket_name: MinIO bucket name
            max_files_per_user: Maximum files per user
        """
        self.minio_client = minio_client
        self.minio_client_external = minio_client_external
        self.bucket_name = bucket_name
        self.max_files_per_user = max_files_per_user
    
    def initiate_upload(
        self,
        user_id: str,
        file_name: str,
        iv: str,
        auth_tag: str,
        file_size: int,
        mime_type: Optional[str] = None
    ) -> dict:
        """
        Initiate file upload by generating presigned URL.
        
        Flow:
        1. Validate user limits
        2. Generate unique object_key
        3. Create presigned upload URL
        4. Store metadata with status='pending'
        5. Return upload_url and file_id
        
        Args:
            user_id: User UUID
            file_name: Original filename
            iv: Initialization vector (base64)
            auth_tag: AES-GCM auth tag (base64)
            file_size: File size in bytes
            mime_type: MIME type (optional)
        
        Returns:
            dict with upload_url, file_id, object_key
        
        Raises:
            ValueError: If user has reached file limit
        """
        with get_db() as db:
            # Check user file count
            file_count = FileRepository.count_user_files(db, user_id)
            if file_count >= self.max_files_per_user:
                raise ValueError(f"File limit reached ({self.max_files_per_user} files)")
            
            # Generate unique object key
            object_key = f"{user_id}/{uuid.uuid4()}"
            
            # Generate presigned upload URL (15 minutes)
            # Generate presigned upload URL (15 minutes)
            # CRITICAL: We use minio_client_external so the signature uses the host the browser sees.
            upload_url = self.minio_client_external.generate_upload_url(
                bucket_name=self.bucket_name,
                object_key=object_key,
                expires=900  # 15 minutes
            )
            
            # Create file metadata with status='pending'
            file_meta = FileRepository.create_file_metadata(
                db=db,
                user_id=user_id,
                object_key=object_key,
                file_name=file_name,
                iv=iv,
                auth_tag=auth_tag,
                file_size=file_size,
                mime_type=mime_type,
                status="pending"
            )
            
            logger.info(f"Upload initiated: {file_name} for user {user_id}")
            
            return {
                "upload_url": upload_url,
                "file_id": str(file_meta.id),
                "object_key": object_key
            }
    
    def confirm_upload(self, user_id: str, file_id: str) -> bool:
        """
        Confirm file upload after client uploads to MinIO.
        
        Flow:
        1. Verify file belongs to user
        2. Check object exists in MinIO
        3. Update metadata status to 'uploaded'
        4. Log activity
        
        Args:
            user_id: User UUID
            file_id: File UUID
        
        Returns:
            True if confirmed successfully
        
        Raises:
            ValueError: If file not found or doesn't belong to user
        """
        with get_db() as db:
            # Get file metadata
            file_meta = FileRepository.get_file_by_id(db, file_id)
            if not file_meta:
                raise ValueError("File not found")
            
            # Verify ownership
            if str(file_meta.user_id) != str(user_id):
                raise ValueError("File does not belong to user")
            
            # Verify object exists in MinIO
            if not self.minio_client.object_exists(self.bucket_name, file_meta.object_key):
                raise ValueError("File not found in storage")
            
            # Update status to 'uploaded'
            FileRepository.update_file_status(db, file_id, "uploaded")
            
            # Log activity
            ActivityRepository.log_activity(
                db=db,
                user_id=user_id,
                action="upload",
                file_name=file_meta.file_name,
                file_id=file_id,
                details=f"{round(file_meta.file_size / 1024, 1)} KB"
            )
            
            logger.info(f"Upload confirmed: {file_meta.file_name} (ID: {file_id})")
            return True
    
    def get_download_url(self, user_id: str, file_id: str) -> dict:
        """
        Generate presigned download URL.
        
        Flow:
        1. Verify file belongs to user
        2. Generate presigned download URL
        3. Log activity
        4. Return download_url with metadata
        
        Args:
            user_id: User UUID
            file_id: File UUID
        
        Returns:
            dict with download_url, file_name, iv, auth_tag
        
        Raises:
            ValueError: If file not found or doesn't belong to user
        """
        with get_db() as db:
            # Get file metadata
            file_meta = FileRepository.get_file_by_id(db, file_id)
            if not file_meta:
                raise ValueError("File not found")
            
            # Verify ownership
            if str(file_meta.user_id) != str(user_id):
                raise ValueError("File does not belong to user")
            
            # Verify file is uploaded (not pending)
            if file_meta.status != "uploaded":
                raise ValueError("File upload not confirmed")
            
            # Generate presigned download URL (15 minutes)
            # Generate presigned download URL (15 minutes)
            # CRITICAL: We use minio_client_external so the signature uses the host the browser sees.
            download_url = self.minio_client_external.generate_download_url(
                bucket_name=self.bucket_name,
                object_key=file_meta.object_key,
                expires=900  # 15 minutes
            )
            
            # Log activity
            ActivityRepository.log_activity(
                db=db,
                user_id=user_id,
                action="download",
                file_name=file_meta.file_name,
                file_id=file_id,
                details=""
            )
            
            logger.info(f"Download URL generated: {file_meta.file_name} (ID: {file_id})")
            
            return {
                "download_url": download_url,
                "file_name": file_meta.file_name,
                "iv": file_meta.iv,
                "auth_tag": file_meta.auth_tag,
                "file_size": file_meta.file_size,
                "mime_type": file_meta.mime_type
            }
    
    def delete_file(self, user_id: str, file_id: str) -> bool:
        """
        Delete file (transactional: MinIO first, then metadata).
        
        Flow:
        1. Verify file belongs to user
        2. Delete from MinIO
        3. Delete metadata from database
        4. Log activity
        
        Args:
            user_id: User UUID
            file_id: File UUID
        
        Returns:
            True if deleted successfully
        
        Raises:
            ValueError: If file not found or doesn't belong to user
        """
        with get_db() as db:
            # Get file metadata
            file_meta = FileRepository.get_file_by_id(db, file_id)
            if not file_meta:
                raise ValueError("File not found")
            
            # Verify ownership
            if str(file_meta.user_id) != str(user_id):
                raise ValueError("File does not belong to user")
            
            # Delete from MinIO first (if it exists)
            if file_meta.status == "uploaded":
                self.minio_client.delete_object(self.bucket_name, file_meta.object_key)
            
            # Delete metadata from database
            file_name = file_meta.file_name
            FileRepository.delete_file(db, file_id)
            
            # Log activity
            ActivityRepository.log_activity(
                db=db,
                user_id=user_id,
                action="delete",
                file_name=file_name,
                file_id=file_id,
                details=""
            )
            
            logger.info(f"File deleted: {file_name} (ID: {file_id})")
            return True
    
    def update_file_tags(self, user_id: str, file_id: str, tags: list) -> bool:
        """
        Update file tags.
        
        Args:
            user_id: User UUID
            file_id: File UUID
            tags: List of tag strings
        
        Returns:
            True if updated successfully
        
        Raises:
            ValueError: If file not found or doesn't belong to user
        """
        with get_db() as db:
            # Get file metadata
            file_meta = FileRepository.get_file_by_id(db, file_id)
            if not file_meta:
                raise ValueError("File not found")
            
            # Verify ownership
            if str(file_meta.user_id) != str(user_id):
                raise ValueError("File does not belong to user")
            
            # Update tags
            FileRepository.update_file_tags(db, file_id, tags)
            
            # Log activity
            ActivityRepository.log_activity(
                db=db,
                user_id=user_id,
                action="tag",
                file_name=file_meta.file_name,
                file_id=file_id,
                details=f"Tags: {', '.join(tags)}"
            )
            
            logger.info(f"File tags updated: {file_meta.file_name} -> {tags}")
            return True

    def get_file_preview(self, user_id: str, file_id: str) -> dict:
        """
        Generate file preview (download from MinIO, compute SHA-256 and read first 256 bytes).
        """
        import hashlib
        with get_db() as db:
            # Get file metadata
            file_meta = FileRepository.get_file_by_id(db, file_id)
            if not file_meta:
                raise ValueError("File not found")
            
            # Verify ownership
            if str(file_meta.user_id) != str(user_id):
                raise ValueError("File does not belong to user")
            
            # Verify file is uploaded
            if file_meta.status != "uploaded":
                raise ValueError("File upload not confirmed")
            
            # Download file from MinIO
            try:
                response = self.minio_client.client.get_object(self.bucket_name, file_meta.object_key)
                try:
                    data = response.read()
                finally:
                    response.close()
                    response.release_conn()
            except Exception as e:
                logger.error(f"Failed to read file from MinIO: {str(e)}")
                raise ValueError("Failed to retrieve file from storage")
            
            sha256_hash = hashlib.sha256(data).hexdigest()
            preview_hex = data[:256].hex()
            
            return {
                "file_id": str(file_meta.id),
                "file_name": file_meta.file_name,
                "size_bytes": file_meta.file_size,
                "sha256_hash": sha256_hash,
                "preview_hex": preview_hex,
                "preview_length": len(data[:256]),
                "message": "Ciphertext preview loaded successfully"
            }
