# app/auth/services.py
"""
Authentication Service - Core business logic for dual-stack authentication
Handles both traditional password verification and DID signature verification
"""

import secrets
import bcrypt
from datetime import datetime, timedelta
from web3 import Web3
from eth_account.messages import encode_defunct
from typing import Optional, Dict, Tuple
import jwt
from flask import current_app

class AuthService:
    """
    Orchestrates authentication logic for both Traditional and DID methods.
    Implements challenge-response for DID and password hashing for Traditional.
    """
    
    def __init__(self, db_session, config):
        self.db = db_session
        self.config = config
        self.w3 = Web3()  # No provider needed for signature verification
    
    # ========== TRADITIONAL AUTHENTICATION ==========
    
    def register_traditional(self, username: str, password: str, role: str = 'Student') -> Dict:
        """
        Register a new traditional user with username/password.
        
        Args:
            username: Unique username
            password: Plain text password (will be hashed)
            role: User role (Student/Faculty)
            
        Returns:
            Dict with user_id and success status
        """
        from app.models import User
        
        # Check uniqueness
        existing = self.db.query(User).filter_by(username=username).first()
        if existing:
            return {'success': False, 'error': 'USERNAME_EXISTS'}
        
        # Hash password with bcrypt (cost factor 12)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))
        
        # Create user
        user = User(
            username=username,
            password_hash=password_hash.decode('utf-8'),
            role=role,
            cohort='CONTROL'
        )
        
        self.db.add(user)
        self.db.commit()
        
        return {'success': True, 'user_id': user.id, 'auth_method': 'TRADITIONAL'}
    
    def verify_traditional(self, username: str, password: str) -> Tuple[bool, Optional[Dict]]:
        """
        Verify traditional credentials.
        
        Args:
            username: Username to verify
            password: Password to check
            
        Returns:
            Tuple of (success: bool, user_data: dict or None)
        """
        from app.models import User
        
        user = self.db.query(User).filter_by(username=username).first()
        
        if not user or not user.password_hash:
            return False, None
        
        # Verify password
        is_valid = bcrypt.checkpw(
            password.encode('utf-8'), 
            user.password_hash.encode('utf-8')
        )
        
        if is_valid:
            user_data = {
                'user_id': user.id,
                'username': user.username,
                'role': user.role,
                'auth_method': 'TRADITIONAL'
            }
            return True, user_data
        
        return False, None
    
    # ========== DID AUTHENTICATION (Challenge-Response) ==========
    
    def generate_nonce(self, wallet_address: str) -> Dict:
        """
        Generate a cryptographically secure nonce for DID authentication.
        
        Args:
            wallet_address: Ethereum address claiming identity
            
        Returns:
            Dict containing the nonce and expiration time
        """
        from app.models import AuthNonce
        
        # Normalize address
        address = Web3.to_checksum_address(wallet_address)
        
        # Generate cryptographically secure random nonce (32 bytes = 64 hex chars)
        nonce = secrets.token_hex(32)
        
        # Create friendly message for user understanding
        # This maintains security while reducing cognitive load
        message = (
            f"I am logging into the University Portal to access my dashboard.\n"
            f"This signature proves I own this wallet without revealing my private key.\n\n"
            f"Challenge ID: {nonce[:16]}...\n"
            f"Time: {datetime.utcnow().isoformat()}"
        )
        
        # Store nonce with 5-minute expiration
        expiration = datetime.utcnow() + timedelta(minutes=5)
        
        nonce_record = AuthNonce(
            wallet_address=address,
            nonce=nonce,
            expires_at=expiration,
            used=False
        )
        
        # Clean up any existing unused nonces for this address
        self.db.query(AuthNonce).filter_by(
            wallet_address=address, 
            used=False
        ).delete()
        
        self.db.add(nonce_record)
        self.db.commit()
        
        return {
            'nonce': nonce,
            'message': message,
            'expires_at': expiration.isoformat()
        }
    
    def verify_signature(self, wallet_address: str, signature: str) -> Tuple[bool, Optional[Dict]]:
        """
        Verify cryptographic signature using ECDSA recovery.
        
        This implements EIP-191 signature verification:
        1. Retrieve the stored nonce for this address
        2. Reconstruct the signed message with Ethereum prefix
        3. Recover the signer's address from the signature
        4. Verify the recovered address matches the claimed address
        
        Args:
            wallet_address: Claimed Ethereum address
            signature: Hex-encoded signature from MetaMask
            
        Returns:
            Tuple of (success: bool, user_data: dict or None)
        """
        from app.models import User, AuthNonce
        
        try:
            # Normalize address
            address = Web3.to_checksum_address(wallet_address)
            
            # Retrieve nonce
            nonce_record = self.db.query(AuthNonce).filter_by(
                wallet_address=address,
                used=False
            ).first()
            
            if not nonce_record:
                return False, {'error': 'NONCE_NOT_FOUND', 'category': 'SYSTEM'}
            
            # Check expiration
            if datetime.utcnow() > nonce_record.expires_at:
                return False, {'error': 'NONCE_EXPIRED', 'category': 'SYSTEM'}
            
            # Reconstruct the message with EIP-191 prefix
            # This is critical for security - prevents signing transactions disguised as login
            message = (
                f"I am logging into the University Portal to access my dashboard.\n"
                f"This signature proves I own this wallet without revealing my private key.\n\n"
                f"Challenge ID: {nonce_record.nonce[:16]}...\n"
                f"Time: {nonce_record.created_at.isoformat()}"
            )
            
            message_hash = encode_defunct(text=message)
            
            # Recover signer address using ECDSA
            recovered_address = self.w3.eth.account.recover_message(
                message_hash,
                signature=signature
            )
            
            # Verify recovered address matches claimed address
            if recovered_address.lower() != address.lower():
                return False, {
                    'error': 'SIGNATURE_MISMATCH',
                    'category': 'USABILITY',
                    'details': 'Recovered address does not match claimed address'
                }
            
            # Mark nonce as used to prevent replay attacks
            nonce_record.used = True
            self.db.commit()
            
            # Check if user exists, if not create them
            user = self.db.query(User).filter_by(wallet_address=address).first()
            
            if not user:
                # Auto-registration for DID users
                user = User(
                    wallet_address=address,
                    role='Student',
                    cohort='EXPERIMENTAL'
                )
                self.db.add(user)
                self.db.commit()
            
            user_data = {
                'user_id': user.id,
                'wallet_address': user.wallet_address,
                'role': user.role,
                'auth_method': 'DID'
            }
            
            return True, user_data
            
        except ValueError as e:
            # Invalid signature format or address
            return False, {
                'error': 'INVALID_SIGNATURE_FORMAT',
                'category': 'USABILITY',
                'details': str(e)
            }
        except Exception as e:
            # Unexpected error
            return False, {
                'error': 'VERIFICATION_FAILED',
                'category': 'SYSTEM',
                'details': str(e)
            }
    
    # ========== JWT SESSION MANAGEMENT ==========
    
    def generate_jwt(self, user_data: Dict) -> str:
        """
        Generate a signed JWT token for stateless session management.
        
        Args:
            user_data: Dict containing user_id, auth_method, role
            
        Returns:
            Signed JWT token string
        """
        payload = {
            'user_id': user_data['user_id'],
            'auth_method': user_data['auth_method'],
            'role': user_data['role'],
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=2)  # 2-hour session
        }
        
        token = jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        return token
    
    def verify_jwt(self, token: str) -> Tuple[bool, Optional[Dict]]:
        """
        Verify and decode JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Tuple of (valid: bool, payload: dict or None)
        """
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            return True, payload
        except jwt.ExpiredSignatureError:
            return False, {'error': 'TOKEN_EXPIRED'}
        except jwt.InvalidTokenError:
            return False, {'error': 'INVALID_TOKEN'}


# ========== UTILITY FUNCTIONS ==========

def calculate_hesitation_score(mouse_data: Dict) -> float:
    """
    Calculate hesitation score from mouse movement data.
    
    Formula: Total Distance Traveled / Optimal Distance (straight line)
    A score of 1.0 means perfect direct movement
    Higher scores indicate more hesitation/searching
    
    Args:
        mouse_data: Dict with 'total_distance' and 'start_pos', 'end_pos'
        
    Returns:
        Hesitation score (float)
    """
    import math
    
    total_distance = mouse_data.get('total_distance', 0)
    start_x, start_y = mouse_data.get('start_pos', (0, 0))
    end_x, end_y = mouse_data.get('end_pos', (0, 0))
    
    # Calculate optimal (straight line) distance
    optimal_distance = math.sqrt(
        (end_x - start_x)**2 + (end_y - start_y)**2
    )
    
    if optimal_distance == 0:
        return 0.0
    
    # Hesitation score: how much longer was actual path vs optimal
    score = total_distance / optimal_distance
    
    return round(score, 4)


def classify_error(error_code: str) -> str:
    """
    Classify errors into SYSTEM or USABILITY categories for research analysis.
    
    Args:
        error_code: Error code string
        
    Returns:
        'SYSTEM' or 'USABILITY'
    """
    usability_errors = {
        'USER_REJECTED_SIGNATURE',
        'INVALID_PASSWORD',
        'TIMEOUT_IDLE',
        'SIGNATURE_MISMATCH',
        'INVALID_CREDENTIALS'
    }
    
    if error_code in usability_errors:
        return 'USABILITY'
    
    return 'SYSTEM'