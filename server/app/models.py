# app/models.py
"""
SQLAlchemy ORM Models for CSEC08 Research Platform

Maps database schema to Python objects for type-safe database access.
Implements the dual-stack user model and telemetry logging.
"""

from datetime import datetime
from app import db
import enum

# ========== Enums ==========

class AuthMethod(enum.Enum):
    """Authentication method enumeration"""
    TRADITIONAL = "TRADITIONAL"
    DID = "DID"

class UserRole(enum.Enum):
    """User role enumeration"""
    STUDENT = "Student"
    FACULTY = "Faculty"
    ADMIN = "Admin"

# ========== Models ==========

class User(db.Model):
    """
    User model supporting dual-stack authentication.
    
    A user can authenticate via EITHER:
    - Traditional: username + password_hash
    - DID: wallet_address
    
    The database constraint enforces mutual exclusivity.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    wallet_address = db.Column(db.String(42), unique=True, nullable=True)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    cohort = db.Column(db.String(20))  # 'CONTROL' or 'EXPERIMENTAL'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    auth_logs = db.relationship('AuthLog', back_populates='user', cascade='all, delete-orphan')
    survey_responses = db.relationship('SurveyResponse', back_populates='user', cascade='all, delete-orphan')
    
    def __repr__(self):
        identifier = self.username or self.wallet_address
        return f'<User {identifier}>'
    
    @property
    def auth_method(self):
        """Determine authentication method based on available credentials"""
        if self.wallet_address:
            return AuthMethod.DID
        elif self.username and self.password_hash:
            return AuthMethod.TRADITIONAL
        return None
    
    def to_dict(self):
        """Serialize user for API responses"""
        return {
            'id': self.id,
            'username': self.username,
            'wallet_address': self.wallet_address,
            'role': self.role.value,
            'cohort': self.cohort,
            'auth_method': self.auth_method.value if self.auth_method else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AuthNonce(db.Model):
    """
    Temporary storage for DID authentication challenges.
    
    Nonces are single-use and expire after 5 minutes to prevent replay attacks.
    """
    __tablename__ = 'auth_nonces'
    
    id = db.Column(db.Integer, primary_key=True)
    wallet_address = db.Column(db.String(42), nullable=False, index=True)
    nonce = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    used = db.Column(db.Boolean, default=False, index=True)
    
    def __repr__(self):
        return f'<AuthNonce {self.wallet_address} expires={self.expires_at}>'
    
    @property
    def is_expired(self):
        """Check if nonce has expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if nonce can be used"""
        return not self.used and not self.is_expired


class AuthLog(db.Model):
    """
    Primary telemetry table - captures all authentication attempts.
    
    This is the core research data, measuring:
    - Time-on-task (milliseconds)
    - Cognitive load proxies (hesitation scores)
    - Success/failure patterns
    - Error categorization
    """
    __tablename__ = 'auth_logs'
    
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    auth_method = db.Column(db.Enum(AuthMethod), nullable=False, index=True)
    
    # Timing metrics
    time_taken_ms = db.Column(db.Integer, nullable=False)
    component_mount_ms = db.Column(db.Integer)
    wallet_connect_ms = db.Column(db.Integer)      # DID only
    challenge_request_ms = db.Column(db.Integer)   # DID only
    sign_duration_ms = db.Column(db.Integer)       # DID only
    
    # Cognitive load metrics
    hesitation_score = db.Column(db.Numeric(10, 4))
    mouse_total_distance = db.Column(db.Numeric(10, 2))
    mouse_idle_time_ms = db.Column(db.Integer)
    
    # Outcome tracking
    success = db.Column(db.Boolean, nullable=False, index=True)
    error_code = db.Column(db.String(50))
    error_category = db.Column(db.String(20))  # 'SYSTEM' or 'USABILITY'
    
    # Metadata
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    session_id = db.Column(db.String(36))
    user_agent = db.Column(db.Text)
    participant_sequence = db.Column(db.Integer)
    test_condition = db.Column(db.String(50))
    
    # Relationships
    user = db.relationship('User', back_populates='auth_logs')
    
    def __repr__(self):
        return f'<AuthLog {self.auth_method.value} success={self.success}>'
    
    def to_dict(self):
        """Serialize log entry for analysis"""
        return {
            'log_id': self.log_id,
            'user_id': self.user_id,
            'auth_method': self.auth_method.value,
            'time_taken_ms': self.time_taken_ms,
            'hesitation_score': float(self.hesitation_score) if self.hesitation_score else None,
            'success': self.success,
            'error_code': self.error_code,
            'error_category': self.error_category,
            'timestamp': self.timestamp.isoformat()
        }


class SurveyResponse(db.Model):
    """
    Post-authentication survey responses.
    
    Captures qualitative data to complement quantitative telemetry.
    Links user experience ratings to their authentication method.
    """
    __tablename__ = 'survey_responses'
    
    response_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    auth_method = db.Column(db.Enum(AuthMethod), nullable=False)
    
    # Likert scale responses (1-5)
    ease_of_use = db.Column(db.Integer)
    perceived_security = db.Column(db.Integer)
    confidence_level = db.Column(db.Integer)
    willingness_to_reuse = db.Column(db.Integer)
    
    # Open-ended feedback
    qualitative_feedback = db.Column(db.Text)
    reported_difficulties = db.Column(db.Text)
    
    # Metadata
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    completion_time_seconds = db.Column(db.Integer)
    
    # Relationships
    user = db.relationship('User', back_populates='survey_responses')
    
    def __repr__(self):
        return f'<SurveyResponse user={self.user_id} method={self.auth_method.value}>'
    
    def to_dict(self):
        """Serialize survey response"""
        return {
            'response_id': self.response_id,
            'user_id': self.user_id,
            'auth_method': self.auth_method.value,
            'ease_of_use': self.ease_of_use,
            'perceived_security': self.perceived_security,
            'confidence_level': self.confidence_level,
            'willingness_to_reuse': self.willingness_to_reuse,
            'qualitative_feedback': self.qualitative_feedback,
            'submitted_at': self.submitted_at.isoformat()
        }


class SystemEvent(db.Model):
    """
    System events and error logging for debugging.
    
    Separate from research telemetry - used for technical troubleshooting.
    """
    __tablename__ = 'system_events'
    
    event_id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False, index=True)
    severity = db.Column(db.String(20), default='INFO', index=True)  # INFO, WARNING, ERROR, CRITICAL
    message = db.Column(db.Text)
    stack_trace = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f'<SystemEvent {self.event_type} severity={self.severity}>'


class AdminAction(db.Model):
    """
    Audit trail for administrative actions.
    
    Tracks kiosk resets, data exports, and other admin operations.
    """
    __tablename__ = 'admin_actions'
    
    action_id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action_type = db.Column(db.String(50), nullable=False)  # 'RESET_SESSION', 'EXPORT_DATA', etc.
    target_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    details = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f'<AdminAction {self.action_type} by admin={self.admin_id}>'