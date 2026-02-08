#!/usr/bin/env python3
# scripts/export_telemetry.py
"""
Export telemetry data for analysis
Usage: python export_telemetry.py [--format csv|json] [--method TRADITIONAL|DID]
"""

import argparse
from datetime import datetime
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.app import create_app, db
from server.app.telemetry.services import TelemetryExporter

def main():
    parser = argparse.ArgumentParser(description='Export telemetry data')
    parser.add_argument('--format', choices=['csv', 'json'], default='json')
    parser.add_argument('--method', choices=['TRADITIONAL', 'DID'])
    parser.add_argument('--output', help='Output filename')
    
    args = parser.parse_args()
    
    app = create_app()
    
    with app.app_context():
        exporter = TelemetryExporter(db.session)
        
        if args.format == 'csv':
            data = exporter.export_to_csv()
        else:
            data = exporter.export_to_json()
        
        # Save to file
        if args.output:
            filename = args.output
        else:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'telemetry_export_{timestamp}.{args.format}'
        
        with open(filename, 'w') as f:
            f.write(data)
        
        print(f'✅ Data exported to: {filename}')

if __name__ == '__main__':
    main()