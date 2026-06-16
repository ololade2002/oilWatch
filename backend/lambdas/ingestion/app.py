import json
import boto3
import os
from decimal import Decimal # Added this import

# Setting up DB Connection
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get("TELEMETRY_TABLE_NAME") 
table = dynamodb.Table(TABLE_NAME)

def ingest_handler(event, context):
    try:
        print(f'Received incoming IoT payload:', json.dumps(event))

        # Unpacking incoming payload
        asset_id = event.get("asset_id")
        telemetry_type = event.get("telemetry_type")
        metrics = event.get("metrics")
        timestamp = event.get("timestamp")

        # Validation
        if not asset_id or not metrics or not timestamp:
             print(f"Validation failed: Missing critical payload fields.")
             return {
                 "statusCode": 400,
                 "body": json.dumps('Incomplete telemetry structure.')
             }

        # Building single table design
        if telemetry_type == "wellhead":
             pk = f"WELL#{asset_id}"
        elif telemetry_type == "facility":
             pk = f"FACILITY#{asset_id}"
        else:
             pk = f"ASSET#{asset_id}"
        sk = f"TS#{timestamp}"    
     
        # Convert all floats in the metrics dictionary to Decimals
        # This loops through your metrics and safely casts them for DynamoDB
        dynamo_metrics = json.loads(json.dumps(metrics), parse_float=Decimal)

        # Writes to dynamodb
        db_item = {
             "asset_id": pk,         
             "timestamp": sk,        
             "raw_asset_id": asset_id,
             "telemetry_type": telemetry_type,
             "metrics": dynamo_metrics, # Pass the converted decimals here
        }
     
        table.put_item(Item=db_item)
        print(f"Data successfully logged to DynamoDB for {pk} at {sk}")
        return {
             "statusCode": 200,
             "body": json.dumps(f"Successfully processed {asset_id}")
         }

    except Exception as e:
        print(f"Critical Error during processing: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps(f"Internal server ingestion failure: {str(e)}")
        }