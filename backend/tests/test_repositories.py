import pytest
import uuid
from repositories.user_repository import UserRepository
from repositories.file_repository import FileRepository
from repositories.token_repository import TokenRepository
from datetime import datetime, timedelta, UTC

def test_user_repository(db_session):
    # Create
    email = f"repo_test_{uuid.uuid4().hex[:6]}@test.com"
    user = UserRepository.create_user(db_session, email, "hash", role="user")
    assert user.email == email
    
    # Get by email
    fetched = UserRepository.get_user_by_email(db_session, email)
    assert fetched.id == user.id
    
    # Get by id
    fetched_by_id = UserRepository.get_user_by_id(db_session, user.id)
    assert fetched_by_id.email == email
    
    # Exists
    assert UserRepository.user_exists(db_session, email) is True
    assert UserRepository.user_exists(db_session, "nonexistent@test.com") is False
    
    # Update role
    UserRepository.update_user_role(db_session, user.id, "admin")
    db_session.refresh(user)
    assert user.role == "admin"

def test_file_repository(db_session):
    user_id = str(uuid.uuid4())
    
    # Create
    file_entry = FileRepository.create_file_metadata(
        db_session, 
        user_id=user_id,
        object_key="keys/test.txt",
        file_name="test.txt",
        iv="fake-iv",
        auth_tag="fake-tag",
        file_size=100,
        mime_type="text/plain",
        status="uploaded"
    )
    assert file_entry.file_name == "test.txt"
    
    # Get
    fetched = FileRepository.get_file_by_id(db_session, file_entry.id)
    assert str(fetched.user_id) == user_id
    
    # List by owner
    files = FileRepository.get_user_files(db_session, user_id)
    assert len(files) == 1
    assert files[0].id == file_entry.id
    
    # Delete
    FileRepository.delete_file(db_session, file_entry.id)
    assert FileRepository.get_file_by_id(db_session, file_entry.id) is None

def test_token_repository(db_session):
    user_id = str(uuid.uuid4())
    token = "test-refresh-token"
    expires_at = datetime.now(UTC) + timedelta(days=1)
    
    # Store
    TokenRepository.store_refresh_token(db_session, user_id, token, expires_at)
    
    # Verify
    assert TokenRepository.verify_refresh_token(db_session, user_id, token) is True
    assert TokenRepository.verify_refresh_token(db_session, user_id, "wrong-token") is False
    
    # Revoke
    TokenRepository.revoke_user_tokens(db_session, user_id)
    assert TokenRepository.verify_refresh_token(db_session, user_id, token) is False
