# server/app/telemetry/routes.py
"""
Telemetry API Endpoints
Handles logging and querying of research telemetry data
"""
from app.telemetry.services import TelemetryAnalyzer, TelemetryExporter
from flask import Blueprint, request, jsonify
from app.models import AuthLog, db
from datetime import datetime, timedelta
from sqlalchemy import func

telemetry_bp = Blueprint('telemetry', __name__, url_prefix='/api/telemetry')

@telemetry_bp.route('/log', methods=['POST'])
def log_event():
    """
    Manual telemetry logging endpoint (if needed for additional events)
    Usually telemetry is logged automatically during authentication
    """
    data = request.get_json()
    
    try:
        log = AuthLog(
            user_id=data.get('user_id'),
            auth_method=data.get('auth_method'),
            time_taken_ms=data.get('time_taken_ms'),
            hesitation_score=data.get('hesitation_score'),
            mouse_total_distance=data.get('mouse_total_distance'),
            mouse_idle_time_ms=data.get('mouse_idle_time_ms'),
            success=data.get('success', False),
            error_code=data.get('error_code'),
            error_category=data.get('error_category'),
            session_id=data.get('session_id')
        )
        
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'success': True, 'log_id': log.log_id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Add new endpoint for comprehensive statistics
@telemetry_bp.route('/analysis', methods=['GET'])
def get_analysis():
    """Get comprehensive analysis"""
    analyzer = TelemetryAnalyzer(db.session)
    return jsonify(analyzer.compare_methods()), 200

@telemetry_bp.route('/stats', methods=['GET'])
def get_statistics():
    """
    Get aggregate statistics for research analysis
    
    Query params:
    - method: Filter by auth method (TRADITIONAL or DID)
    - days: Number of days to include (default: 7)
    """
    auth_method = request.args.get('method')
    days = int(request.args.get('days', 7))
    
    # Date filter
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Build query
    query = db.session.query(
        AuthLog.auth_method,
        func.count(AuthLog.log_id).label('total_attempts'),
        func.sum(func.cast(AuthLog.success, db.Integer)).label('successful_attempts'),
        func.avg(func.case(
            (AuthLog.success == True, AuthLog.time_taken_ms),
            else_=None
        )).label('avg_success_time_ms'),
        func.avg(AuthLog.hesitation_score).label('avg_hesitation_score')
    ).filter(
        AuthLog.timestamp >= start_date
    )
    
    if auth_method:
        query = query.filter(AuthLog.auth_method == auth_method)
    
    stats = query.group_by(AuthLog.auth_method).all()
    
    results = []
    for stat in stats:
        results.append({
            'auth_method': stat.auth_method.value,
            'total_attempts': stat.total_attempts,
            'successful_attempts': stat.successful_attempts or 0,
            'success_rate': round((stat.successful_attempts or 0) / stat.total_attempts * 100, 2),
            'avg_success_time_ms': round(stat.avg_success_time_ms, 2) if stat.avg_success_time_ms else None,
            'avg_hesitation_score': round(float(stat.avg_hesitation_score), 4) if stat.avg_hesitation_score else None
        })
    
    return jsonify({
        'period_days': days,
        'statistics': results
    }), 200


@telemetry_bp.route('/export', methods=['GET'])
def export_data():
    """
    Export raw telemetry data for external analysis
    
    Query params:
    - format: csv or json (default: json)
    - start_date: ISO format date
    - end_date: ISO format date
    """
    format_type = request.args.get('format', 'json')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = AuthLog.query
    
    if start_date:
        query = query.filter(AuthLog.timestamp >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(AuthLog.timestamp <= datetime.fromisoformat(end_date))
    
    logs = query.order_by(AuthLog.timestamp.desc()).all()
    
    if format_type == 'json':
        return jsonify({
            'count': len(logs),
            'data': [log.to_dict() for log in logs]
        }), 200
    
    # CSV export would go here
    return jsonify({'error': 'CSV export not yet implemented'}), 501