# server/app/config.py
"""
Flask Configuration Classes
Separate configs for development, testing, and production
"""

import os
from datetime import timedelta

class BaseConfig:
    """Base configuration - shared across all environments"""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    
    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # Security
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Research settings
    NONCE_EXPIRY_MINUTES = 5
    MAX_LOGIN_ATTEMPTS = 5


class DevelopmentConfig(BaseConfig):
    """Development environment configuration"""
    DEBUG = True
    TESTING = False
    
    # Database URL
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://localhost/csec08_research'
    )
    
    # Enable SQL query logging in development
    SQLALCHEMY_ECHO = True
    
    # CORS - Allow localhost for development
    CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']


class TestingConfig(BaseConfig):
    """Testing environment configuration"""
    TESTING = True
    DEBUG = True
    
    # Use separate test database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'TEST_DATABASE_URL',
        'postgresql://localhost/csec08_research_test'
    )
    
    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False


class ProductionConfig(BaseConfig):
    """Production environment configuration"""
    DEBUG = False
    TESTING = False
    
    # MUST set these via environment variables in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # Enhanced security for production
    SESSION_COOKIE_SECURE = True
    
    # Production CORS (restrict to actual domain)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
    
    # Error handling
    PROPAGATE_EXCEPTIONS = False


# Config dictionary for easy access
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}