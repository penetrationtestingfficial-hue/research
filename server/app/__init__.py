from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    from app.auth.routes import auth_bp
    from app.telemetry.routes import telemetry_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(telemetry_bp)
    
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'db': 'research'}, 200
    
    return app