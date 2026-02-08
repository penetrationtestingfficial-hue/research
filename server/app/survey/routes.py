# server/app/survey/routes.py
from flask import Blueprint, request, jsonify
from app.models import SurveyResponse, db
from datetime import datetime

survey_bp = Blueprint('survey', __name__, url_prefix='/api/survey')

@survey_bp.route('/submit', methods=['POST'])
def submit_survey():
    """Submit post-authentication survey"""
    data = request.get_json()
    
    try:
        response = SurveyResponse(
            user_id=data.get('user_id'),
            auth_method=data.get('auth_method'),
            ease_of_use=data.get('ease_of_use'),
            perceived_security=data.get('perceived_security'),
            confidence_level=data.get('confidence_level'),
            willingness_to_reuse=data.get('willingness_to_reuse'),
            qualitative_feedback=data.get('qualitative_feedback'),
            completion_time_seconds=data.get('completion_time_seconds')
        )
        
        db.session.add(response)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'response_id': response.response_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500