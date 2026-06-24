import json
import boto3
from decimal import Decimal

# Initialize the DynamoDB resource
dynamodb = boto3.resource('dynamodb')
# Matches your explicit alerts table name
TABLE_NAME = 'OilWatchAlertsTable' 
table = dynamodb.Table(TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    """
    Converts DynamoDB Decimals into standard floats/ints 
    so json.dumps doesn't throw a serialization error.
    """
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def getAlerts_handler(event, context):
    # Setup response headers for local React development (CORS)
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    try:
        # Scan the alerts table to gather all active anomaly flags
        response = table.scan()
        raw_alerts = response.get('Items', [])
        
        # Format the items cleanly for your frontend mapping matrix
        formatted_alerts = []
        for item in raw_alerts:
            formatted_alerts.append({
                "id": item.get('alert_id') or item.get('id') or "N/A",
                "asset": item.get('asset_id') or item.get('asset') or "UNKNOWN",
                "type": item.get('anomaly_type') or item.get('type') or "ANOMALY",
                "severity": item.get('severity') or "WARNING",
                "message": item.get('message') or "Operational threshold exceeded safety bounds.",
                "timestamp": item.get('timestamp') or "Just now"
            })
            
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(formatted_alerts, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Alert extraction failure: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to fetch live alerts table logs', 'details': str(e)})
        }