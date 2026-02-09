from app import create_app, db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
        
        # Create test user
        from app.models import User
        from werkzeug.security import generate_password_hash
        
        if not User.query.filter_by(username='student001').first():
            user = User(
                username='student001',
                password_hash=generate_password_hash('test123')
            )
            db.session.add(user)
            db.session.commit()
            print("✅ Test user created: student001 / test123")
    
    print("\n🚀 Starting Flask server on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)