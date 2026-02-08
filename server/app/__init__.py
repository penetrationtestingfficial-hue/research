# server/app/__init__.py
"""
Flask Application Factory
Creates and configures the Flask application instance
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os
from app.survey.routes import survey_bp

# Initialize extensions (but don't bind to app yet)
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='development'):
    """
    Application factory pattern
    Creates and configures a Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(f'app.config.{config_name.capitalize()}Config')
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS for React frontend
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Register blueprints
    from app.auth.routes import auth_bp
    from app.telemetry.routes import telemetry_bp
    app.register_blueprint(survey_bp)

    app.register_blueprint(auth_bp)
    app.register_blueprint(telemetry_bp)
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'version': '1.0.0'}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    return app