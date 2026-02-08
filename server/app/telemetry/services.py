# server/app/telemetry/services.py
"""
Telemetry Service - Data processing and analysis for research metrics
Handles aggregation, statistical analysis, and export of telemetry data
"""
from app import db
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from app.models import AuthLog, User, SurveyResponse, db
import statistics
import json


class TelemetryAnalyzer:
    """
    Analyzes authentication telemetry data for research purposes.
    Provides statistical aggregations and comparative metrics.
    """
    
    def __init__(self, db_session):
        self.db = db_session
    
    def get_summary_statistics(
        self,
        auth_method: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """
        Calculate summary statistics for authentication attempts.
        
        Args:
            auth_method: Filter by 'TRADITIONAL' or 'DID' (optional)
            start_date: Start of date range (optional)
            end_date: End of date range (optional)
            
        Returns:
            Dict with summary statistics
        """
        # Build query
        query = self.db.query(AuthLog)
        
        if auth_method:
            query = query.filter(AuthLog.auth_method == auth_method)
        if start_date:
            query = query.filter(AuthLog.timestamp >= start_date)
        if end_date:
            query = query.filter(AuthLog.timestamp <= end_date)
        
        logs = query.all()
        
        if not logs:
            return {'error': 'No data found for specified criteria'}
        
        # Calculate metrics
        total_attempts = len(logs)
        successful = [log for log in logs if log.success]
        failed = [log for log in logs if not log.success]
        
        success_times = [log.time_taken_ms for log in successful]
        failure_times = [log.time_taken_ms for log in failed]
        
        hesitation_scores = [
            float(log.hesitation_score) 
            for log in successful 
            if log.hesitation_score
        ]
        
        return {
            'total_attempts': total_attempts,
            'successful_attempts': len(successful),
            'failed_attempts': len(failed),
            'success_rate': round(len(successful) / total_attempts * 100, 2),
            
            # Timing statistics (milliseconds)
            'timing': {
                'mean_success_time': round(statistics.mean(success_times), 2) if success_times else None,
                'median_success_time': round(statistics.median(success_times), 2) if success_times else None,
                'stddev_success_time': round(statistics.stdev(success_times), 2) if len(success_times) > 1 else None,
                'min_success_time': min(success_times) if success_times else None,
                'max_success_time': max(success_times) if success_times else None,
                'mean_failure_time': round(statistics.mean(failure_times), 2) if failure_times else None
            },
            
            # Hesitation metrics
            'hesitation': {
                'mean_score': round(statistics.mean(hesitation_scores), 4) if hesitation_scores else None,
                'median_score': round(statistics.median(hesitation_scores), 4) if hesitation_scores else None,
                'stddev_score': round(statistics.stdev(hesitation_scores), 4) if len(hesitation_scores) > 1 else None
            },
            
            # Error analysis
            'errors': self._analyze_errors(failed),
            
            # Date range
            'date_range': {
                'start': min(log.timestamp for log in logs).isoformat(),
                'end': max(log.timestamp for log in logs).isoformat()
            }
        }
    
    def compare_methods(self) -> Dict:
        """
        Compare Traditional vs DID authentication methods.
        
        Returns:
            Comparative analysis dict
        """
        traditional_stats = self.get_summary_statistics(auth_method='TRADITIONAL')
        did_stats = self.get_summary_statistics(auth_method='DID')
        
        # Calculate percentage differences
        if (traditional_stats.get('timing', {}).get('median_success_time') and 
            did_stats.get('timing', {}).get('median_success_time')):
            
            trad_time = traditional_stats['timing']['median_success_time']
            did_time = did_stats['timing']['median_success_time']
            time_diff_pct = round((did_time - trad_time) / trad_time * 100, 2)
        else:
            time_diff_pct = None
        
        return {
            'traditional': traditional_stats,
            'did': did_stats,
            'comparison': {
                'time_difference_pct': time_diff_pct,
                'interpretation': self._interpret_comparison(time_diff_pct),
                'success_rate_diff': round(
                    did_stats.get('success_rate', 0) - traditional_stats.get('success_rate', 0),
                    2
                )
            }
        }
    
    def get_user_journey(self, user_id: int) -> Dict:
        """
        Get complete authentication journey for a specific user.
        
        Args:
            user_id: User ID
            
        Returns:
            User's authentication history and patterns
        """
        logs = self.db.query(AuthLog).filter(
            AuthLog.user_id == user_id
        ).order_by(AuthLog.timestamp).all()
        
        if not logs:
            return {'error': 'No authentication history found'}
        
        return {
            'user_id': user_id,
            'total_attempts': len(logs),
            'auth_method': logs[0].auth_method.value,
            'first_attempt': logs[0].timestamp.isoformat(),
            'last_attempt': logs[-1].timestamp.isoformat(),
            'attempts': [self._log_to_dict(log) for log in logs],
            'learning_curve': self._analyze_learning_curve(logs)
        }
    
    def get_error_distribution(self) -> Dict:
        """
        Analyze error patterns across authentication methods.
        
        Returns:
            Error distribution analysis
        """
        failed_logs = self.db.query(AuthLog).filter(
            AuthLog.success == False
        ).all()
        
        errors_by_method = {'TRADITIONAL': {}, 'DID': {}}
        
        for log in failed_logs:
            method = log.auth_method.value
            error = log.error_code or 'UNKNOWN'
            
            if error not in errors_by_method[method]:
                errors_by_method[method][error] = {
                    'count': 0,
                    'category': log.error_category
                }
            
            errors_by_method[method][error]['count'] += 1
        
        return {
            'total_failures': len(failed_logs),
            'by_method': errors_by_method,
            'usability_vs_system': self._categorize_errors(failed_logs)
        }
    
    def get_time_series_data(
        self,
        auth_method: Optional[str] = None,
        interval: str = 'hour'
    ) -> List[Dict]:
        """
        Get time-series data for visualization.
        
        Args:
            auth_method: Filter by method
            interval: 'hour', 'day', or 'week'
            
        Returns:
            List of time-series data points
        """
        query = self.db.query(
            func.date_trunc(interval, AuthLog.timestamp).label('period'),
            func.count(AuthLog.log_id).label('total'),
            func.sum(func.cast(AuthLog.success, db.Integer)).label('successful'),
            func.avg(AuthLog.time_taken_ms).label('avg_time')
        )
        
        if auth_method:
            query = query.filter(AuthLog.auth_method == auth_method)
        
        results = query.group_by('period').order_by('period').all()
        
        return [
            {
                'timestamp': r.period.isoformat(),
                'total_attempts': r.total,
                'successful': r.successful or 0,
                'success_rate': round((r.successful or 0) / r.total * 100, 2),
                'avg_time_ms': round(float(r.avg_time), 2) if r.avg_time else None
            }
            for r in results
        ]
    
    def _analyze_errors(self, failed_logs: List[AuthLog]) -> Dict:
        """Analyze error patterns from failed logs"""
        if not failed_logs:
            return {}
        
        error_counts = {}
        for log in failed_logs:
            error = log.error_code or 'UNKNOWN'
            if error not in error_counts:
                error_counts[error] = {
                    'count': 0,
                    'category': log.error_category,
                    'percentage': 0
                }
            error_counts[error]['count'] += 1
        
        # Calculate percentages
        total = len(failed_logs)
        for error in error_counts:
            error_counts[error]['percentage'] = round(
                error_counts[error]['count'] / total * 100, 2
            )
        
        # Sort by frequency
        sorted_errors = sorted(
            error_counts.items(),
            key=lambda x: x[1]['count'],
            reverse=True
        )
        
        return dict(sorted_errors)
    
    def _analyze_learning_curve(self, logs: List[AuthLog]) -> Dict:
        """
        Analyze if user improves over time.
        
        Args:
            logs: Ordered list of user's authentication attempts
            
        Returns:
            Learning curve analysis
        """
        if len(logs) < 3:
            return {'message': 'Insufficient data for learning curve analysis'}
        
        successful_attempts = [log for log in logs if log.success]
        
        if len(successful_attempts) < 2:
            return {'message': 'Insufficient successful attempts'}
        
        times = [log.time_taken_ms for log in successful_attempts]
        
        # Calculate trend (simple linear regression slope)
        n = len(times)
        x = list(range(n))
        x_mean = statistics.mean(x)
        y_mean = statistics.mean(times)
        
        numerator = sum((x[i] - x_mean) * (times[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        slope = numerator / denominator if denominator != 0 else 0
        
        return {
            'total_attempts': len(logs),
            'successful_attempts': len(successful_attempts),
            'first_success_time_ms': times[0],
            'last_success_time_ms': times[-1],
            'average_time_ms': round(statistics.mean(times), 2),
            'trend_slope': round(slope, 4),
            'improvement': 'Yes' if slope < -10 else 'Minimal' if slope < 10 else 'No',
            'interpretation': self._interpret_slope(slope)
        }
    
    def _interpret_slope(self, slope: float) -> str:
        """Interpret learning curve slope"""
        if slope < -50:
            return "Significant improvement over time"
        elif slope < -10:
            return "Moderate improvement over time"
        elif slope <= 10:
            return "Consistent performance"
        elif slope <= 50:
            return "Slight degradation over time"
        else:
            return "Significant degradation over time"
    
    def _interpret_comparison(self, diff_pct: Optional[float]) -> str:
        """Interpret time difference between methods"""
        if diff_pct is None:
            return "Insufficient data for comparison"
        
        if abs(diff_pct) < 5:
            return "Methods are comparable in speed"
        elif diff_pct > 0:
            return f"DID is {abs(diff_pct):.1f}% slower than Traditional"
        else:
            return f"DID is {abs(diff_pct):.1f}% faster than Traditional"
    
    def _categorize_errors(self, failed_logs: List[AuthLog]) -> Dict:
        """Categorize errors into USABILITY vs SYSTEM"""
        usability_count = sum(
            1 for log in failed_logs 
            if log.error_category == 'USABILITY'
        )
        system_count = len(failed_logs) - usability_count
        
        return {
            'usability_errors': usability_count,
            'system_errors': system_count,
            'usability_percentage': round(usability_count / len(failed_logs) * 100, 2) if failed_logs else 0
        }
    
    def _log_to_dict(self, log: AuthLog) -> Dict:
        """Convert AuthLog to dict"""
        return {
            'timestamp': log.timestamp.isoformat(),
            'success': log.success,
            'time_taken_ms': log.time_taken_ms,
            'error_code': log.error_code,
            'hesitation_score': float(log.hesitation_score) if log.hesitation_score else None
        }


class TelemetryExporter:
    """
    Export telemetry data in various formats for external analysis.
    """
    
    def __init__(self, db_session):
        self.db = db_session
    
    def export_to_csv(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> str:
        """
        Export telemetry data to CSV format.
        
        Returns:
            CSV string
        """
        query = self.db.query(AuthLog)
        
        if start_date:
            query = query.filter(AuthLog.timestamp >= start_date)
        if end_date:
            query = query.filter(AuthLog.timestamp <= end_date)
        
        logs = query.order_by(AuthLog.timestamp).all()
        
        # CSV header
        csv_rows = [
            'log_id,user_id,auth_method,time_taken_ms,hesitation_score,'
            'mouse_total_distance,mouse_idle_time_ms,success,error_code,'
            'error_category,timestamp,session_id'
        ]
        
        # Data rows
        for log in logs:
            row = ','.join(str(v) if v is not None else '' for v in [
                log.log_id,
                log.user_id,
                log.auth_method.value,
                log.time_taken_ms,
                log.hesitation_score,
                log.mouse_total_distance,
                log.mouse_idle_time_ms,
                log.success,
                log.error_code,
                log.error_category,
                log.timestamp.isoformat(),
                log.session_id
            ])
            csv_rows.append(row)
        
        return '\n'.join(csv_rows)
    
    def export_to_json(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        include_metadata: bool = True
    ) -> str:
        """
        Export telemetry data to JSON format.
        
        Returns:
            JSON string
        """
        query = self.db.query(AuthLog)
        
        if start_date:
            query = query.filter(AuthLog.timestamp >= start_date)
        if end_date:
            query = query.filter(AuthLog.timestamp <= end_date)
        
        logs = query.order_by(AuthLog.timestamp).all()
        
        data = {
            'logs': [log.to_dict() for log in logs]
        }
        
        if include_metadata:
            data['metadata'] = {
                'export_timestamp': datetime.utcnow().isoformat(),
                'total_records': len(logs),
                'date_range': {
                    'start': start_date.isoformat() if start_date else None,
                    'end': end_date.isoformat() if end_date else None
                }
            }
        
        return json.dumps(data, indent=2)
    
    def export_summary_report(self) -> Dict:
        """
        Generate comprehensive summary report.
        
        Returns:
            Complete summary dict
        """
        analyzer = TelemetryAnalyzer(self.db)
        
        return {
            'report_generated': datetime.utcnow().isoformat(),
            'overall_statistics': analyzer.get_summary_statistics(),
            'method_comparison': analyzer.compare_methods(),
            'error_distribution': analyzer.get_error_distribution(),
            'recommendations': self._generate_recommendations(analyzer)
        }
    
    def _generate_recommendations(self, analyzer: TelemetryAnalyzer) -> List[str]:
        """Generate recommendations based on data analysis"""
        recommendations = []
        
        comparison = analyzer.compare_methods()
        
        # Check if DID is significantly slower
        time_diff = comparison.get('comparison', {}).get('time_difference_pct')
        if time_diff and time_diff > 20:
            recommendations.append(
                "DID authentication shows significantly longer times. "
                "Consider UX improvements in wallet interaction flow."
            )
        
        # Check error rates
        errors = analyzer.get_error_distribution()
        usability_pct = errors.get('usability_vs_system', {}).get('usability_percentage', 0)
        
        if usability_pct > 50:
            recommendations.append(
                f"High usability error rate ({usability_pct:.1f}%). "
                "Focus on improving user guidance and error messages."
            )
        
        return recommendations


class TelemetryValidator:
    """
    Validate telemetry data for research integrity.
    """
    
    @staticmethod
    def validate_log_entry(log_data: Dict) -> Tuple[bool, Optional[str]]:
        """
        Validate telemetry log entry before insertion.
        
        Args:
            log_data: Log entry dict
            
        Returns:
            Tuple of (is_valid: bool, error_message: str or None)
        """
        required_fields = ['auth_method', 'time_taken_ms', 'success']
        
        for field in required_fields:
            if field not in log_data:
                return False, f"Missing required field: {field}"
        
        # Validate time_taken_ms is reasonable (0-300000ms = 5 minutes)
        time_taken = log_data.get('time_taken_ms')
        if not isinstance(time_taken, (int, float)) or time_taken < 0 or time_taken > 300000:
            return False, "Invalid time_taken_ms value"
        
        # Validate hesitation_score if present (should be >= 1.0)
        hesitation = log_data.get('hesitation_score')
        if hesitation is not None:
            if not isinstance(hesitation, (int, float)) or hesitation < 1.0:
                return False, "Invalid hesitation_score (must be >= 1.0)"
        
        return True, None
    
    @staticmethod
    def detect_anomalies(logs: List[AuthLog]) -> List[Dict]:
        """
        Detect anomalous data points that may indicate issues.
        
        Args:
            logs: List of authentication logs
            
        Returns:
            List of detected anomalies
        """
        anomalies = []
        
        times = [log.time_taken_ms for log in logs if log.success]
        
        if len(times) > 10:
            mean_time = statistics.mean(times)
            stddev_time = statistics.stdev(times)
            
            # Check for outliers (>3 standard deviations)
            for log in logs:
                if log.success and abs(log.time_taken_ms - mean_time) > 3 * stddev_time:
                    anomalies.append({
                        'log_id': log.log_id,
                        'type': 'TIME_OUTLIER',
                        'value': log.time_taken_ms,
                        'expected_range': f"{mean_time - 3*stddev_time:.0f}-{mean_time + 3*stddev_time:.0f}ms"
                    })
        
        return anomalies
