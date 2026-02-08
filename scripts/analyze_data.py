#!/usr/bin/env python3
# scripts/analyze_data.py
"""
Comprehensive data analysis for CSEC08 research
Generates statistical reports and visualizations
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.app import create_app, db
from server.app.telemetry.services import TelemetryAnalyzer

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def main():
    app = create_app()
    
    with app.app_context():
        analyzer = TelemetryAnalyzer(db.session)
        
        # Overall Statistics
        print_section("OVERALL STATISTICS")
        overall = analyzer.get_summary_statistics()
        print(f"Total Attempts: {overall.get('total_attempts')}")
        print(f"Success Rate: {overall.get('success_rate')}%")
        print(f"Median Time: {overall.get('timing', {}).get('median_success_time')}ms")
        
        # Method Comparison
        print_section("TRADITIONAL vs DID COMPARISON")
        comparison = analyzer.compare_methods()
        
        trad = comparison.get('traditional', {})
        did = comparison.get('did', {})
        
        print("TRADITIONAL:")
        print(f"  Success Rate: {trad.get('success_rate')}%")
        print(f"  Median Time: {trad.get('timing', {}).get('median_success_time')}ms")
        print(f"  Hesitation: {trad.get('hesitation', {}).get('median_score')}")
        
        print("\nDID:")
        print(f"  Success Rate: {did.get('success_rate')}%")
        print(f"  Median Time: {did.get('timing', {}).get('median_success_time')}ms")
        print(f"  Hesitation: {did.get('hesitation', {}).get('median_score')}")
        
        print(f"\nInterpretation: {comparison.get('comparison', {}).get('interpretation')}")
        
        # Error Analysis
        print_section("ERROR ANALYSIS")
        errors = analyzer.get_error_distribution()
        print(f"Total Failures: {errors.get('total_failures')}")
        
        usability_vs_system = errors.get('usability_vs_system', {})
        print(f"\nUsability Errors: {usability_vs_system.get('usability_percentage')}%")
        print(f"System Errors: {100 - usability_vs_system.get('usability_percentage', 0)}%")
        
        print("\n" + "="*60)
        print(f"  Report Generated: {datetime.now().isoformat()}")
        print("="*60 + "\n")

if __name__ == '__main__':
    main()