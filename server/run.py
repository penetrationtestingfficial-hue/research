# server/run.py
"""
Flask Application Entry Point
Run this file to start the development server
"""

import os
from app import create_app, db

# Determine environment
env = os.environ.get('FLASK_ENV', 'development')

# Create Flask app
app = create_app(env)

# Create database tables if they don't exist
with app.app_context():
    db.create_all()
    print("✅ Database tables created/verified")

if __name__ == '__main__':
    print(f"""
    ╔════════════════════════════════════════════════════╗
    ║   CSEC08 Research Platform - Backend Server       ║
    ║   Environment: {env:<35} ║
    ╚════════════════════════════════════════════════════╝
    
    🚀 Server starting...
    📍 API Base URL: http://127.0.0.1:5000/api
    📊 Health Check: http://127.0.0.1:5000/api/health
    
    Available endpoints:
    • POST /api/auth/register/traditional
    • POST /api/auth/login/traditional
    • GET  /api/auth/nonce/<address>
    • POST /api/auth/verify
    • GET  /api/auth/session
    • POST /api/telemetry/log
    
    Press CTRL+C to stop
    """)
    
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True if env == 'development' else False
    )