# server/app/database/repositories.py
"""
Data access layer - abstracts database queries
"""
from app.models import User, AuthLog, db

class UserRepository:
    @staticmethod
    def find_by_username(username):
        return User.query.filter_by(username=username).first()
    
    @staticmethod
    def find_by_wallet(address):
        return User.query.filter_by(wallet_address=address).first()