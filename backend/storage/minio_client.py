"""
MinIO Client - Object storage layer for encrypted blob management.
Handles presigned URL generation for direct client-to-storage uploads/downloads.
"""

import logging
from datetime import timedelta
from typing import Optional

from minio import Minio
from minio.error import S3Error

logger = logging.getLogger("veil.storage.minio")


class MinIOClient:
    """
    MinIO client wrapper for encrypted blob storage.
    
    CRITICAL: This client NEVER touches the encrypted blob data.
    It only generates presigned URLs for direct client access.
    """
    
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        secure: bool = False,
        region: Optional[str] = None
    ):
        """
        Initialize MinIO client.
        
        Args:
            endpoint: MinIO server endpoint (e.g., 'localhost:9000')
            access_key: MinIO access key
            secret_key: MinIO secret key
            secure: Use HTTPS (True) or HTTP (False)
            region: AWS/MinIO region
        """
        self.client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
            region=region
        )
        
        logger.info(f"MinIO client initialized: {endpoint} (secure={secure}, region={region})")
    
    def initialize_bucket(self, bucket_name: str) -> None:
        """
        Create bucket if it doesn't exist.
        
        Args:
            bucket_name: Name of the bucket to create
        """
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"MinIO bucket created: {bucket_name}")
            else:
                logger.info(f"MinIO bucket already exists: {bucket_name}")
        except S3Error as e:
            logger.error(f"Failed to initialize bucket {bucket_name}: {str(e)}")
            raise
    
    def generate_upload_url(
        self,
        bucket_name: str,
        object_key: str,
        expires: int = 900
    ) -> str:
        """
        Generate presigned PUT URL for uploading encrypted blob.
        
        Args:
            bucket_name: Bucket name
            object_key: Unique object identifier
            expires: URL expiration in seconds (default: 15 minutes)
        
        Returns:
            Presigned PUT URL
        """
        try:
            url = self.client.presigned_put_object(
                bucket_name=bucket_name,
                object_name=object_key,
                expires=timedelta(seconds=expires)
            )
            
            logger.info(f"Generated upload URL for {object_key} (expires in {expires}s)")
            return url
        except S3Error as e:
            logger.error(f"Failed to generate upload URL for {object_key}: {str(e)}")
            raise
    
    def generate_download_url(
        self,
        bucket_name: str,
        object_key: str,
        expires: int = 900
    ) -> str:
        """
        Generate presigned GET URL for downloading encrypted blob.
        
        Args:
            bucket_name: Bucket name
            object_key: Unique object identifier
            expires: URL expiration in seconds (default: 15 minutes)
        
        Returns:
            Presigned GET URL
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name=bucket_name,
                object_name=object_key,
                expires=timedelta(seconds=expires)
            )
            
            logger.info(f"Generated download URL for {object_key} (expires in {expires}s)")
            return url
        except S3Error as e:
            logger.error(f"Failed to generate download URL for {object_key}: {str(e)}")
            raise
    
    def delete_object(self, bucket_name: str, object_key: str) -> bool:
        """
        Delete object from MinIO.
        
        Args:
            bucket_name: Bucket name
            object_key: Object identifier
        
        Returns:
            True if deleted successfully
        """
        try:
            self.client.remove_object(bucket_name, object_key)
            logger.info(f"Deleted object: {object_key}")
            return True
        except S3Error as e:
            logger.error(f"Failed to delete object {object_key}: {str(e)}")
            return False
    
    def object_exists(self, bucket_name: str, object_key: str) -> bool:
        """
        Check if object exists in MinIO.
        
        Args:
            bucket_name: Bucket name
            object_key: Object identifier
        
        Returns:
            True if object exists, False otherwise
        """
        try:
            self.client.stat_object(bucket_name, object_key)
            return True
        except S3Error:
            return False
    
    def get_object_size(self, bucket_name: str, object_key: str) -> Optional[int]:
        """
        Get object size in bytes.
        
        Args:
            bucket_name: Bucket name
            object_key: Object identifier
        
        Returns:
            Size in bytes or None if object doesn't exist
        """
        try:
            stat = self.client.stat_object(bucket_name, object_key)
            return stat.size
        except S3Error:
            return None
