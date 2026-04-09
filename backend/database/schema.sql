-- =============================================================================
-- VEIL Database Schema - PostgreSQL
-- =============================================================================
-- Zero-Knowledge Architecture: This database stores ONLY metadata
-- NO encryption keys, NO plaintext file content, NO passwords
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    auth_hash VARCHAR(255) NOT NULL,  -- bcrypt hash of client-derived authKey
    salt VARCHAR(64),                 -- Hex-encoded 32-bytes salt (anti-énumération)
    role VARCHAR(50) NOT NULL DEFAULT 'user',  -- 'user' or 'admin'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast email lookups
CREATE INDEX idx_users_email ON users(email);

-- =============================================================================
-- FILES TABLE
-- =============================================================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    object_key VARCHAR(255) NOT NULL UNIQUE,  -- MinIO object identifier
    file_name VARCHAR(255) NOT NULL,
    iv VARCHAR(255) NOT NULL,  -- Initialization vector (base64)
    auth_tag VARCHAR(255) NOT NULL,  -- AES-GCM authentication tag (base64)
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,  -- Array of tags for organization
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending' or 'uploaded'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_object_key ON files(object_key);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_tags ON files USING GIN(tags);

-- =============================================================================
-- REFRESH_TOKENS TABLE
-- =============================================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,  -- bcrypt hash of refresh token
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for token validation and cleanup
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- =============================================================================
-- ACTIVITY_LOG TABLE
-- =============================================================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,  -- 'upload', 'download', 'delete', 'tag'
    file_id UUID,  -- Nullable (may reference deleted file)
    file_name VARCHAR(255),
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast user activity queries
CREATE INDEX idx_activity_log_user_timestamp ON activity_log(user_id, timestamp DESC);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for files table
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CLEANUP FUNCTION (for expired tokens)
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================
COMMENT ON TABLE users IS 'User accounts - stores only identity and auth hash';
COMMENT ON TABLE files IS 'File metadata - NO plaintext content, only references to MinIO objects';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON TABLE activity_log IS 'User activity history for audit trail';

COMMENT ON COLUMN files.object_key IS 'Unique identifier for encrypted blob in MinIO';
COMMENT ON COLUMN files.iv IS 'Initialization vector for AES-GCM decryption (client-side)';
COMMENT ON COLUMN files.auth_tag IS 'Authentication tag for AES-GCM integrity verification';
COMMENT ON COLUMN files.status IS 'Upload status: pending (URL generated) or uploaded (confirmed)';
