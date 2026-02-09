CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    wallet_address VARCHAR(42) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    auth_method VARCHAR(20),
    success BOOLEAN,
    time_taken_ms INTEGER,
    hesitation_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nonces (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42),
    nonce TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);