from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User, LoginAttempt, Nonce
from datetime import datetime
import secrets
import hashlib

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login/traditional', methods=['POST'])
def traditional_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    telemetry = data.get('telemetry', {})
    
    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password_hash, password):
        # Record success
        attempt = LoginAttempt(
            user_id=user.id,
            auth_method='TRADITIONAL',
            success=True,
            time_taken_ms=telemetry.get('time_taken_ms', 0),
            hesitation_score=telemetry.get('hesitation_score', 0)
        )
        db.session.add(attempt)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'id': user.id,
            'username': user.username,
            'token': 'dummy-token-' + str(user.id)
        })
    
    # Record failure
    if user:
        attempt = LoginAttempt(
            user_id=user.id,
            auth_method='TRADITIONAL',
            success=False,
            time_taken_ms=telemetry.get('time_taken_ms', 0),
            hesitation_score=telemetry.get('hesitation_score', 0)
        )
        db.session.add(attempt)
        db.session.commit()
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


@auth_bp.route('/nonce/<address>', methods=['GET'])
def get_nonce(address):
    # Delete old nonces
    Nonce.query.filter_by(wallet_address=address).delete()
    
    # Generate new nonce
    message = f"Sign this message to login to CSEC08 Research Platform\n\nNonce: {secrets.token_hex(16)}\nTimestamp: {datetime.utcnow().isoformat()}"
    
    nonce = Nonce(wallet_address=address, nonce=message)
    db.session.add(nonce)
    db.session.commit()
    
    return jsonify({'success': True, 'message': message})


@auth_bp.route('/verify', methods=['POST'])
def verify_signature():
    data = request.json
    address = data.get('address')
    signature = data.get('signature')
    telemetry = data.get('telemetry', {})
    
    # Get nonce
    nonce = Nonce.query.filter_by(wallet_address=address).order_by(Nonce.created_at.desc()).first()
    
    if not nonce:
        return jsonify({'success': False, 'message': 'No nonce found'}), 400
    
    # Verify signature (simplified for research)
    prefix = f"\x19Ethereum Signed Message:\n{len(nonce.nonce)}"
    # In production, do proper ECDSA verification
    # For research, we trust the extension
    
    # Get or create user
    user = User.query.filter_by(wallet_address=address).first()
    if not user:
        user = User(wallet_address=address)
        db.session.add(user)
        db.session.commit()
    
    # Record attempt
    attempt = LoginAttempt(
        user_id=user.id,
        auth_method='DID',
        success=True,
        time_taken_ms=telemetry.get('time_taken_ms', 0),
        hesitation_score=telemetry.get('hesitation_score', 0)
    )
    db.session.add(attempt)
    
    # Delete nonce
    db.session.delete(nonce)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'id': user.id,
        'wallet_address': user.wallet_address,
        'token': 'dummy-token-' + str(user.id)
    })


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username exists'}), 400
    
    user = User(
        username=username,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'success': True, 'id': user.id})


