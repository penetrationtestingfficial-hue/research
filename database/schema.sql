-- CSEC08 Research Platform Database Schema
-- PostgreSQL 14+

-- Enum for authentication methods
CREATE TYPE auth_method_enum AS ENUM ('TRADITIONAL', 'DID');

-- Enum for user roles
CREATE TYPE user_role_enum AS ENUM ('Student', 'Faculty', 'Admin');

-- Main Users table supporting dual-stack authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    wallet_address VARCHAR(42) UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'Student',
    cohort VARCHAR(20),  -- For A/B group assignment (e.g., 'CONTROL', 'EXPERIMENTAL')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Constraint: User must have EITHER traditional OR DID credentials
    CONSTRAINT user_auth_method CHECK (
        (username IS NOT NULL AND password_hash IS NOT NULL AND wallet_address IS NULL)
        OR
        (wallet_address IS NOT NULL AND username IS NULL AND password_hash IS NULL)
    )
);

-- Index for fast lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Nonce storage for DID challenge-response
CREATE TABLE auth_nonces (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT unique_active_nonce UNIQUE (wallet_address, nonce)
);

-- Index for efficient nonce validation
CREATE INDEX idx_nonces_wallet_active ON auth_nonces(wallet_address, used, expires_at);

-- Core telemetry table for research data
CREATE TABLE auth_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    auth_method auth_method_enum NOT NULL,
    
    -- Timing metrics (milliseconds)
    time_taken_ms INTEGER NOT NULL,
    component_mount_ms INTEGER,      -- Time to render UI
    wallet_connect_ms INTEGER,       -- Time to connect MetaMask (DID only)
    challenge_request_ms INTEGER,    -- Network latency for nonce (DID only)
    sign_duration_ms INTEGER,        -- Time user took to sign (DID only)
    
    -- Cognitive load metrics
    hesitation_score DECIMAL(10, 4),     -- Calculated mouse deviation
    mouse_total_distance DECIMAL(10, 2), -- Total pixels traveled
    mouse_idle_time_ms INTEGER,          -- Time with no movement
    
    -- Outcome tracking
    success BOOLEAN NOT NULL,
    error_code VARCHAR(50),
    error_category VARCHAR(20),      -- 'SYSTEM' or 'USABILITY'
    
    -- Metadata
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(36),          -- UUID for multi-step tracking
    user_agent TEXT,
    
    -- Research context
    participant_sequence INTEGER,    -- Order in study (1st, 2nd, 3rd participant)
    test_condition VARCHAR(50)       -- Environmental notes
);

-- Indexes for analysis queries
CREATE INDEX idx_logs_user ON auth_logs(user_id);
CREATE INDEX idx_logs_method ON auth_logs(auth_method);
CREATE INDEX idx_logs_success ON auth_logs(success);
CREATE INDEX idx_logs_timestamp ON auth_logs(timestamp DESC);

-- Post-authentication survey responses
CREATE TABLE survey_responses (
    response_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    auth_method auth_method_enum NOT NULL,
    
    -- Likert scale responses (1-5)
    ease_of_use INTEGER CHECK (ease_of_use BETWEEN 1 AND 5),
    perceived_security INTEGER CHECK (perceived_security BETWEEN 1 AND 5),
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    willingness_to_reuse INTEGER CHECK (willingness_to_reuse BETWEEN 1 AND 5),
    
    -- Open-ended feedback
    qualitative_feedback TEXT,
    reported_difficulties TEXT,
    
    -- Metadata
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time_seconds INTEGER  -- Time to complete survey
);

-- System events log for debugging
CREATE TABLE system_events (
    event_id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO',  -- INFO, WARNING, ERROR, CRITICAL
    message TEXT,
    stack_trace TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_type ON system_events(event_type);
CREATE INDEX idx_events_severity ON system_events(severity);

-- Admin actions audit trail
CREATE TABLE admin_actions (
    action_id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,  -- 'RESET_SESSION', 'EXPORT_DATA', etc.
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- View for simplified telemetry analysis
CREATE VIEW telemetry_summary AS
SELECT 
    auth_method,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_attempts,
    ROUND(AVG(CASE WHEN success THEN time_taken_ms END), 2) as avg_success_time_ms,
    ROUND(AVG(hesitation_score), 4) as avg_hesitation,
    ROUND(STDDEV(CASE WHEN success THEN time_taken_ms END), 2) as stddev_time_ms
FROM auth_logs
GROUP BY auth_method;

-- View for error analysis
CREATE VIEW error_analysis AS
SELECT 
    auth_method,
    error_category,
    error_code,
    COUNT(*) as occurrence_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY auth_method), 2) as percentage
FROM auth_logs
WHERE success = FALSE
GROUP BY auth_method, error_category, error_code
ORDER BY auth_method, occurrence_count DESC;

-- Cleanup function for expired nonces (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_nonces 
    WHERE expires_at < CURRENT_TIMESTAMP OR used = TRUE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.success = TRUE THEN
        UPDATE users SET last_login = NEW.timestamp WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_login
    AFTER INSERT ON auth_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_login();

-- Sample data for testing (10 pre-seeded accounts)
-- Traditional users (Control Group)
INSERT INTO users (username, password_hash, role, cohort) VALUES
('student001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWuVNJuTJhZa', 'Student', 'CONTROL'),  -- password: test123
('student002', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWuVNJuTJhZa', 'Student', 'CONTROL'),
('student003', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWuVNJuTJhZa', 'Student', 'CONTROL'),
('student004', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWuVNJuTJhZa', 'Student', 'CONTROL'),
('student005', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lWuVNJuTJhZa', 'Student', 'CONTROL');

-- DID users (Experimental Group) - addresses match Hardhat default accounts
INSERT INTO users (wallet_address, role, cohort) VALUES
('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'Student', 'EXPERIMENTAL'),  -- Hardhat Account #0
('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'Student', 'EXPERIMENTAL'),  -- Hardhat Account #1
('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'Student', 'EXPERIMENTAL'),  -- Hardhat Account #2
('0x90F79bf6EB2c4f870365E785982E1f101E93b906', 'Student', 'EXPERIMENTAL'),  -- Hardhat Account #3
('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 'Student', 'EXPERIMENTAL');  -- Hardhat Account #4

-- Comments for research clarity
COMMENT ON TABLE users IS 'Dual-stack user table supporting both traditional and DID authentication methods';
COMMENT ON TABLE auth_logs IS 'Primary telemetry data for usability analysis - measures human interaction time';
COMMENT ON COLUMN auth_logs.hesitation_score IS 'Calculated metric: mouse path deviation / optimal path distance';
COMMENT ON TABLE auth_nonces IS 'Temporary storage for DID challenge-response protocol - prevents replay attacks';
COMMENT ON CONSTRAINT user_auth_method ON users IS 'Enforces mutual exclusivity of authentication methods for A/B testing integrity';