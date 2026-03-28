import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
ALERTS_TABLE = os.environ["ALERTS_TABLE"]
alerts_table = dynamodb.Table(ALERTS_TABLE)

def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin":"*",
            "Access-Control-Allow-Methods":"GET, OPTIONS",
            "Access-Control-Allow-Headers":"Content-Type",
            "Content-Type": "application/json"
        },
        "body": json.dumps(body, default=decimal_serializer)
    }


def getAlerts(event, context):
    http_method = event.get("requestContext", {}).get("http", {}).get("method")
 
    if http_method == "OPTIONS":
        return response(200, {"message": "CORS preflight OK"})

    try:
        results = alerts_table.scan()
        alerts = results.get("Items", [])

        alerts.sort(key=lambda x: x.get("alertTime", ""), reverse=True)

        return response(200, {
            "alerts":alerts,
            "count": len(alerts)
        })
    
    except Exception as e:
        return response(500, {
            "message": "Internal server error",
            "error": str(e)
        })