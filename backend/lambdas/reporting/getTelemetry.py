import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = 'OilWatchTelemetry' 
table = dynamodb.Table(TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def getTelemetry_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    try:
        # 1. Grab query param from React / Postman requests
        query_params = event.get('queryStringParameters', {}) or {}
        raw_input = query_params.get('asset', 'ALPHA_1')
        
        # Normalize naming format
        clean_id = raw_input.replace('-', '_').upper()
        
        # 2. DYNAMICALLY BUILD THE PARTITION KEY BASED ON THE ASSET TYPE
        if "SEPARATOR" in clean_id or "MANIFOLD" in clean_id:
            composite_partition_key = f"FACILITY#FACILITY#{clean_id}"
        else:
            composite_partition_key = f"WELL#WELLHEAD#{clean_id}"
            
        print(f"DEBUG: Selected Partition Key: {composite_partition_key}")
  
        # 3. Query DynamoDB for the 50 most recent rows (Strategy 1)
        response = table.query(
            KeyConditionExpression=Key('asset_id').eq(composite_partition_key),
            Limit=50,
            ScanIndexForward=False  # Newest records first
        )
        raw_items = response.get('Items', [])
        
        history_values = []
        last_timestamp = "No database logs found"
        latest_metrics = {}
        
        # 4. Extract data vectors safely across different equipment metric names
        if raw_items:
            # Grab the timestamp of the absolute latest entry recorded
            last_timestamp = str(raw_items[0].get('timestamp', '')).replace('TS#', '')
            latest_metrics = raw_items[0].get('metrics', {})
            
            for item in raw_items:
                metrics = item.get('metrics', {})
                
                # Extract the correct big main value based on what asset is being queried
                if "ALPHA_2" in clean_id:
                    val = metrics.get('water_cut_percentage') or 0
                elif "SEPARATOR" in clean_id:
                    val = metrics.get('oil_level_percentage') or 0
                else:
                    # Default pressure check loop
                    val = (
                        metrics.get('wellhead_pressure_psi') or 
                        metrics.get('manifold_pressure_psi') or 
                        metrics.get('vessel_pressure_psi') or 
                        metrics.get('value') or 
                        0
                    )
                history_values.append(val)
            
            # Reverse so charts read chronologically from Left (oldest) to Right (newest)
            history_values.reverse()
        else:
            history_values = [0, 0, 0]
            last_timestamp = "No telemetry history recorded"
            
        payload = {
            "asset": raw_input,
            "currentValue": history_values[-1],
            "history": history_values,
            "lastSeen": last_timestamp,
            "rawMetrics": latest_metrics  # Sends the full object down for your sub-metrics footer grid!
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(payload, cls=DecimalEncoder) # Safe serialization via your encoder
        }
        
    except Exception as e:
        print(f"CRITICAL SYSTEM ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to seed telemetry history layers', 'details': str(e)})
        }