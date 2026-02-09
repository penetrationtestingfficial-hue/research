import os

class Config:
    DEBUG = True
    SECRET_KEY = 'research-secret-2024'
    JWT_SECRET_KEY = 'jwt-research-2024'
    
    # Single research database
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:admin@localhost:5432/research'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = ['http://localhost:5173']

