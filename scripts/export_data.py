# scripts/export_data.py
"""Export telemetry data to CSV for analysis"""
import pandas as pd
from app import create_app, db
from app.models import AuthLog

app = create_app()
with app.app_context():
    logs = AuthLog.query.all()
    df = pd.DataFrame([log.to_dict() for log in logs])
    df.to_csv('telemetry_export.csv', index=False)
    print(f"Exported {len(logs)} records")