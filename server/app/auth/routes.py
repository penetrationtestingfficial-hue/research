# app/auth/routes.py
"""
Authentication API Endpoints
Implements the dual-stack authentication API for the research platform
"""

from flask import Blueprint, request, jsonify
from app.auth.services import AuthService, classify_error
from app.models import AuthLog
from app.database.repositories import UserRepository
from datetime import datetime
from functools import wraps
import jwt

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def get_auth_service():
    """Dependency injection for AuthService"""
    from app import db
    from flask import current_app
    return AuthService(db.session, current_app.config)


def jwt_required(f):
    """Decorator to protect routes requiring authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'NO_TOKEN'}), 401
        
        auth_service = get_auth_service()
        valid, payload = auth_service.verify_jwt(token)
        
        if not valid:
            return jsonify({'error': payload.get('error')}), 401
        
        request.user_data = payload
        return f(*args, **kwargs)
    
    return decorated_function


# ========== TRADITIONAL AUTHENTICATION ENDPOINTS ==========

@auth_bp.route('/register/traditional', methods=['POST'])
def register_traditional():
    """
    Register a new user with username/password (Control Group)
    
    Request Body:
        {
            "username": "student001",
            "password": "SecurePass123!",
            "role": "Student"
        }
    
    Returns:
        201: User created successfully
        400: Validation error
        409: Username already exists
    """
    data = request.get_json()
    
    # Validation
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({
            'error': 'MISSING_FIELDS',
            'message': 'Username and password are required'
        }), 400
    
    username = data['username'].strip()
    password = data['password']
    role = data.get('role', 'Student')
    
    # Password strength check (research requirement: simulate production standards)
    if len(password) < 8:
        return jsonify({
            'error': 'WEAK_PASSWORD',
            'message': 'Password must be at least 8 characters'
        }), 400
    
    auth_service = get_auth_service()
    result = auth_service.register_traditional(username, password, role)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 409
    
    return jsonify({
        'success': True,
        'user_id': result['user_id'],
        'auth_method': 'TRADITIONAL'
    }), 201


@auth_bp.route('/login/traditional', methods=['POST'])
def login_traditional():
    """
    Authenticate using username/password
    
    Request Body:
        {
            "username": "student001",
            "password": "SecurePass123!",
            "telemetry": {
                "time_taken_ms": 1250,
                "hesitation_score": 1.03,
                "mouse_total_distance": 450.23,
                "mouse_idle_time_ms": 120
            }
        }
    
    Returns:
        200: Login successful with JWT token
        401: Invalid credentials
        400: Validation error
    """
    from app import db
    
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'MISSING_CREDENTIALS'}), 400
    
    username = data['username'].strip()
    password = data['password']
    telemetry = data.get('telemetry', {})
    
    auth_service = get_auth_service()
    success, user_data = auth_service.verify_traditional(username, password)
    
    # Log authentication attempt
    log = AuthLog(
        user_id=user_data['user_id'] if success else None,
        auth_method='TRADITIONAL',
        time_taken_ms=telemetry.get('time_taken_ms', 0),
        hesitation_score=telemetry.get('hesitation_score'),
        mouse_total_distance=telemetry.get('mouse_total_distance'),
        mouse_idle_time_ms=telemetry.get('mouse_idle_time_ms'),
        success=success,
        error_code=None if success else 'INVALID_CREDENTIALS',
        error_category=None if success else 'USABILITY',
        user_agent=request.headers.get('User-Agent'),
        session_id=data.get('session_id')
    )
    
    db.session.add(log)
    db.session.commit()
    
    if not success:
        return jsonify({
            'error': 'INVALID_CREDENTIALS',
            'message': 'Username or password is incorrect'
        }), 401
    
    # Generate JWT token
    token = auth_service.generate_jwt(user_data)
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user_data['user_id'],
            'username': user_data['username'],
            'role': user_data['role']
        },
        'auth_method': 'TRADITIONAL'
    }), 200


# ========== DID AUTHENTICATION ENDPOINTS ==========

@auth_bp.route('/nonce/<address>', methods=['GET'])
def get_nonce(address):
    """
    Generate and return a nonce for DID challenge-response authentication.
    
    This implements step 1 of the DID authentication flow.
    The nonce is stored server-side to prevent replay attacks.
    
    URL Parameter:
        address: Ethereum wallet address (0x...)
    
    Returns:
        200: Nonce generated successfully
        400: Invalid address format
    """
    try:
        # Validate address format
        from web3 import Web3
        if not Web3.is_address(address):
            return jsonify({
                'error': 'INVALID_ADDRESS',
                'message': 'Invalid Ethereum address format'
            }), 400
        
        auth_service = get_auth_service()
        nonce_data = auth_service.generate_nonce(address)
        
        return jsonify({
            'success': True,
            'nonce': nonce_data['nonce'],
            'message': nonce_data['message'],
            'expires_at': nonce_data['expires_at']
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'NONCE_GENERATION_FAILED',
            'message': str(e)
        }), 500


@auth_bp.route('/verify', methods=['POST'])
def verify_signature():
    """
    Verify cryptographic signature and authenticate user (DID method).
    
    This implements step 2 of the DID authentication flow.
    Uses ECDSA recovery to verify the signature without requiring the private key.
    
    Request Body:
        {
            "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "signature": "0x123abc...",
            "telemetry": {
                "time_taken_ms": 2340,
                "wallet_connect_ms": 450,
                "challenge_request_ms": 85,
                "sign_duration_ms": 1800,
                "hesitation_score": 2.15,
                "mouse_total_distance": 890.45,
                "mouse_idle_time_ms": 350
            }
        }
    
    Returns:
        200: Authentication successful with JWT token
        401: Signature verification failed
        400: Validation error
    """
    from app import db
    
    data = request.get_json()
    
    if not data or not data.get('address') or not data.get('signature'):
        return jsonify({
            'error': 'MISSING_FIELDS',
            'message': 'Address and signature are required'
        }), 400
    
    address = data['address']
    signature = data['signature']
    telemetry = data.get('telemetry', {})
    
    auth_service = get_auth_service()
    success, result = auth_service.verify_signature(address, signature)
    
    # Determine error details
    error_code = None
    error_category = None
    
    if not success:
        error_code = result.get('error', 'UNKNOWN_ERROR')
        error_category = result.get('category', classify_error(error_code))
    
    # Log authentication attempt
    log = AuthLog(
        user_id=result.get('user_id') if success else None,
        auth_method='DID',
        time_taken_ms=telemetry.get('time_taken_ms', 0),
        wallet_connect_ms=telemetry.get('wallet_connect_ms'),
        challenge_request_ms=telemetry.get('challenge_request_ms'),
        sign_duration_ms=telemetry.get('sign_duration_ms'),
        hesitation_score=telemetry.get('hesitation_score'),
        mouse_total_distance=telemetry.get('mouse_total_distance'),
        mouse_idle_time_ms=telemetry.get('mouse_idle_time_ms'),
        success=success,
        error_code=error_code,
        error_category=error_category,
        user_agent=request.headers.get('User-Agent'),
        session_id=data.get('session_id')
    )
    
    db.session.add(log)
    db.session.commit()
    
    if not success:
        return jsonify({
            'error': error_code,
            'message': result.get('details', 'Signature verification failed'),
            'category': error_category
        }), 401
    
    # Generate JWT token
    token = auth_service.generate_jwt(result)
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': result['user_id'],
            'wallet_address': result['wallet_address'],
            'role': result['role']
        },
        'auth_method': 'DID'
    }), 200


# ========== SESSION MANAGEMENT ==========

@auth_bp.route('/session', methods=['GET'])
@jwt_required
def get_session():
    """
    Verify current session and return user data.
    Protected route example for authenticated requests.
    """
    return jsonify({
        'valid': True,
        'user': request.user_data
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required
def logout():
    """
    Logout endpoint (JWT is stateless, so this is mainly for client-side cleanup)
    """
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200


# ========== ERROR HANDLERS ==========

@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'error': 'BAD_REQUEST',
        'message': str(error)
    }), 400


@auth_bp.errorhandler(500)
def internal_error(error):
    """Log system errors for debugging"""
    from app.models import SystemEvent
    from app import db
    
    event = SystemEvent(
        event_type='INTERNAL_SERVER_ERROR',
        severity='ERROR',
        message=str(error),
        user_id=getattr(request, 'user_data', {}).get('user_id')
    )
    db.session.add(event)
    db.session.commit()
    
    return jsonify({
        'error': 'INTERNAL_SERVER_ERROR',
        'message': 'An unexpected error occurred'
    }), 500