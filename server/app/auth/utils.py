# server/app/auth/utils.py
"""
Authentication Utility Functions
Cryptographic helpers and validation utilities
"""

import re
import secrets
import hashlib
from typing import Dict, Tuple, Optional
from web3 import Web3
from datetime import datetime, timedelta
from eth_account.messages import encode_defunct


class PasswordValidator:
    """
    Password strength validation for traditional authentication.
    Implements NIST 800-63B guidelines for password security.
    """
    
    MIN_LENGTH = 8
    MAX_LENGTH = 128
    
    # Common password patterns to reject
    COMMON_PASSWORDS = {
        'password', 'Password1', '12345678', 'qwerty123', 'admin123',
        'letmein', 'welcome', 'monkey', 'dragon', 'master', 'sunshine'
    }
    
    @classmethod
    def validate(cls, password: str) -> Tuple[bool, Optional[str]]:
        """
        Validate password strength.
        
        Args:
            password: Plain text password to validate
            
        Returns:
            Tuple of (is_valid: bool, error_message: str or None)
        """
        # Check length
        if len(password) < cls.MIN_LENGTH:
            return False, f"Password must be at least {cls.MIN_LENGTH} characters"
        
        if len(password) > cls.MAX_LENGTH:
            return False, f"Password must not exceed {cls.MAX_LENGTH} characters"
        
        # Check for common passwords
        if password.lower() in cls.COMMON_PASSWORDS:
            return False, "Password is too common. Please choose a stronger password"
        
        # Check for at least one letter and one number (basic complexity)
        has_letter = bool(re.search(r'[a-zA-Z]', password))
        has_number = bool(re.search(r'\d', password))
        
        if not (has_letter and has_number):
            return False, "Password must contain at least one letter and one number"
        
        return True, None
    
    @classmethod
    def estimate_strength(cls, password: str) -> Dict:
        """
        Estimate password strength for user feedback.
        
        Returns:
            Dict with strength score (0-4) and feedback
        """
        score = 0
        feedback = []
        
        # Length bonus
        if len(password) >= 12:
            score += 1
            feedback.append("Good length")
        
        # Character diversity
        if re.search(r'[a-z]', password):
            score += 0.5
        if re.search(r'[A-Z]', password):
            score += 0.5
            feedback.append("Contains uppercase")
        if re.search(r'\d', password):
            score += 0.5
            feedback.append("Contains numbers")
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            score += 1
            feedback.append("Contains special characters")
        
        # Entropy check (simple)
        unique_chars = len(set(password))
        if unique_chars >= len(password) * 0.7:
            score += 0.5
            feedback.append("Good character variety")
        
        strength_labels = {
            0: "Very Weak",
            1: "Weak",
            2: "Fair",
            3: "Strong",
            4: "Very Strong"
        }
        
        return {
            'score': min(int(score), 4),
            'label': strength_labels[min(int(score), 4)],
            'feedback': feedback
        }


class AddressValidator:
    """Ethereum address validation utilities"""
    
    @staticmethod
    def is_valid_address(address: str) -> bool:
        """
        Check if string is a valid Ethereum address.
        
        Args:
            address: Address string to validate
            
        Returns:
            True if valid Ethereum address
        """
        if not address:
            return False
        
        # Check if it's a valid hex string with 0x prefix
        if not address.startswith('0x'):
            return False
        
        if len(address) != 42:  # 0x + 40 hex chars
            return False
        
        try:
            # Use web3.py's built-in validation
            return Web3.is_address(address)
        except Exception:
            return False
    
    @staticmethod
    def normalize_address(address: str) -> str:
        """
        Normalize address to checksummed format.
        
        Args:
            address: Ethereum address
            
        Returns:
            Checksummed address
        """
        return Web3.to_checksum_address(address)


class NonceGenerator:
    """
    Cryptographically secure nonce generation for DID authentication.
    """
    
    @staticmethod
    def generate(length: int = 32) -> str:
        """
        Generate a cryptographically secure random nonce.
        
        Args:
            length: Number of bytes (default 32 = 64 hex chars)
            
        Returns:
            Hex-encoded nonce string
        """
        return secrets.token_hex(length)
    
    @staticmethod
    def create_challenge_message(nonce: str, address: str, timestamp: datetime) -> str:
        """
        Create a human-readable challenge message for signing.
        
        Args:
            nonce: Unique nonce
            address: User's wallet address
            timestamp: Challenge creation time
            
        Returns:
            Formatted challenge message
        """
        message = (
            f"Sign in to CSEC08 Research Platform\n\n"
            f"This signature proves you control this wallet:\n"
            f"{address}\n\n"
            f"Challenge: {nonce[:16]}...\n"
            f"Timestamp: {timestamp.isoformat()}\n\n"
            f"This signature cannot be used to access your funds."
        )
        return message


class SignatureVerifier:
    """
    ECDSA signature verification for DID authentication.
    Implements EIP-191 (personal_sign) standard.
    """
    
    def __init__(self):
        self.w3 = Web3()
    
    def verify(self, message: str, signature: str, expected_address: str) -> Tuple[bool, Optional[str]]:
        """
        Verify ECDSA signature and recover signer address.
        
        Args:
            message: Original signed message
            signature: Hex-encoded signature from wallet
            expected_address: Claimed signer address
            
        Returns:
            Tuple of (is_valid: bool, error_message: str or None)
        """
        try:
            # Normalize addresses
            expected_address = Web3.to_checksum_address(expected_address)
            
            # Encode message with EIP-191 prefix
            # This adds "\x19Ethereum Signed Message:\n<length>" prefix
            encoded_message = encode_defunct(text=message)
            
            # Recover signer address from signature
            recovered_address = self.w3.eth.account.recover_message(
                encoded_message,
                signature=signature
            )
            
            # Compare addresses (case-insensitive)
            if recovered_address.lower() == expected_address.lower():
                return True, None
            else:
                return False, f"Signature verification failed: address mismatch"
                
        except ValueError as e:
            return False, f"Invalid signature format: {str(e)}"
        except Exception as e:
            return False, f"Signature verification error: {str(e)}"
    
    def extract_signature_components(self, signature: str) -> Dict:
        """
        Extract r, s, v components from signature for debugging.
        
        Args:
            signature: Hex-encoded signature
            
        Returns:
            Dict with r, s, v components
        """
        if signature.startswith('0x'):
            signature = signature[2:]
        
        return {
            'r': signature[:64],
            's': signature[64:128],
            'v': signature[128:130]
        }


class SessionTokenGenerator:
    """JWT token generation utilities"""
    
    @staticmethod
    def create_session_id() -> str:
        """
        Create a unique session ID.
        
        Returns:
            UUID4 session ID
        """
        from uuid import uuid4
        return str(uuid4())
    
    @staticmethod
    def hash_session_data(user_id: int, timestamp: datetime) -> str:
        """
        Create a hash of session data for verification.
        
        Args:
            user_id: User ID
            timestamp: Session creation time
            
        Returns:
            SHA256 hash of session data
        """
        data = f"{user_id}:{timestamp.isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()


class ErrorClassifier:
    """
    Classify authentication errors into categories for research analysis.
    """
    
    # Error categories for research telemetry
    USABILITY_ERRORS = {
        'USER_REJECTED_SIGNATURE',
        'USER_REJECTED_CONNECTION',
        'INVALID_CREDENTIALS',
        'TIMEOUT_IDLE',
        'SIGNATURE_MISMATCH',
        'WEAK_PASSWORD',
        'USERNAME_EXISTS'
    }
    
    SYSTEM_ERRORS = {
        'NONCE_NOT_FOUND',
        'NONCE_EXPIRED',
        'DATABASE_ERROR',
        'NETWORK_ERROR',
        'VERIFICATION_FAILED',
        'INVALID_SIGNATURE_FORMAT',
        'INTERNAL_SERVER_ERROR'
    }
    
    @classmethod
    def classify(cls, error_code: str) -> str:
        """
        Classify error into USABILITY or SYSTEM category.
        
        Args:
            error_code: Error code string
            
        Returns:
            'USABILITY' or 'SYSTEM'
        """
        if error_code in cls.USABILITY_ERRORS:
            return 'USABILITY'
        elif error_code in cls.SYSTEM_ERRORS:
            return 'SYSTEM'
        else:
            # Default to SYSTEM for unknown errors
            return 'SYSTEM'
    
    @classmethod
    def get_user_friendly_message(cls, error_code: str) -> str:
        """
        Get user-friendly error message.
        
        Args:
            error_code: Error code
            
        Returns:
            Human-readable error message
        """
        messages = {
            'USER_REJECTED_SIGNATURE': 'You cancelled the signature request. Please try again.',
            'USER_REJECTED_CONNECTION': 'You declined the wallet connection. Click "Connect Wallet" to try again.',
            'INVALID_CREDENTIALS': 'Incorrect username or password. Please try again.',
            'TIMEOUT_IDLE': 'Login timed out due to inactivity. Please try again.',
            'SIGNATURE_MISMATCH': 'Signature verification failed. Please ensure you\'re using the correct wallet.',
            'WEAK_PASSWORD': 'Password is too weak. Please choose a stronger password.',
            'USERNAME_EXISTS': 'Username already taken. Please choose a different username.',
            'NONCE_NOT_FOUND': 'Authentication challenge not found. Please start the login process again.',
            'NONCE_EXPIRED': 'Authentication challenge expired. Please try logging in again.',
            'DATABASE_ERROR': 'A system error occurred. Please try again or contact support.',
            'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
            'VERIFICATION_FAILED': 'Authentication verification failed. Please try again.',
            'INVALID_SIGNATURE_FORMAT': 'Invalid signature format. Please try signing again.',
            'INTERNAL_SERVER_ERROR': 'An unexpected error occurred. Please try again later.'
        }
        
        return messages.get(error_code, 'An error occurred. Please try again.')


class RateLimiter:
    """
    Simple in-memory rate limiter for authentication attempts.
    In production, use Redis for distributed rate limiting.
    """
    
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        """
        Initialize rate limiter.
        
        Args:
            max_attempts: Maximum attempts allowed in time window
            window_seconds: Time window in seconds (default 5 minutes)
        """
        self.max_attempts = max_attempts
        self.window = timedelta(seconds=window_seconds)
        self.attempts = {}  # {identifier: [timestamp1, timestamp2, ...]}
    
    def is_allowed(self, identifier: str) -> Tuple[bool, Optional[str]]:
        """
        Check if identifier is allowed to make attempt.
        
        Args:
            identifier: Username or wallet address
            
        Returns:
            Tuple of (is_allowed: bool, error_message: str or None)
        """
        now = datetime.utcnow()
        
        # Clean old attempts
        if identifier in self.attempts:
            self.attempts[identifier] = [
                ts for ts in self.attempts[identifier]
                if now - ts < self.window
            ]
        
        # Check attempt count
        attempt_count = len(self.attempts.get(identifier, []))
        
        if attempt_count >= self.max_attempts:
            return False, f"Too many attempts. Please wait before trying again."
        
        return True, None
    
    def record_attempt(self, identifier: str):
        """Record an authentication attempt."""
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        self.attempts[identifier].append(datetime.utcnow())
    
    def reset(self, identifier: str):
        """Reset attempts for identifier (after successful login)."""
        if identifier in self.attempts:
            del self.attempts[identifier]


# Module-level utility functions

def sanitize_username(username: str) -> str:
    """
    Sanitize username input.
    
    Args:
        username: Raw username input
        
    Returns:
        Sanitized username
    """
    # Remove leading/trailing whitespace
    username = username.strip()
    
    # Convert to lowercase for consistency
    username = username.lower()
    
    # Remove any potentially dangerous characters
    username = re.sub(r'[^\w\-.]', '', username)
    
    return username


def generate_research_id() -> str:
    """
    Generate anonymous participant ID for research.
    
    Returns:
        Anonymous participant ID (e.g., P001, P002)
    """
    return f"P{secrets.randbelow(9999):04d}"


def format_error_response(error_code: str, details: Optional[str] = None) -> Dict:
    """
    Format standardized error response for API.
    
    Args:
        error_code: Error code
        details: Optional detailed error message
        
    Returns:
        Formatted error dict
    """
    return {
        'error': error_code,
        'message': ErrorClassifier.get_user_friendly_message(error_code),
        'category': ErrorClassifier.classify(error_code),
        'details': details,
        'timestamp': datetime.utcnow().isoformat()
    }
