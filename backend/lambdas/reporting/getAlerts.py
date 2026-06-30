import json
import boto3
from decimal import Decimal


dynamodb = boto3.resource('dynamodb')

TABLE_NAME = "OilWatchAlertsTable"

table = dynamodb.Table(TABLE_NAME)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)

        return super().default(obj)


def getAlerts_handler(event, context):

    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "*"
    }


    try:
        # Fetch alerts
        response = table.scan()
        alerts = response.get("Items", [])


        # Handle DynamoDB pagination
        while "LastEvaluatedKey" in response:
            response = table.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            alerts.extend(
                response.get("Items", [])
            )


        # Sort newest alerts first
        alerts.sort(
            key=lambda x: x.get("timestamp", ""),
            reverse=True
        )

        # Get only latest 20
        latest_alerts = alerts[:20]
        formatted_alerts = []


        for alert in latest_alerts:
            formatted_alerts.append({
                "id": alert.get("alert_id"),
                "asset_id": alert.get("asset_id"),
                "severity": alert.get("severity"),
                "message": alert.get("message"),
                "timestamp": alert.get("timestamp"),
                "observed_value": alert.get("observed_value"),
                "ceiling_value": alert.get("ceiling_value"),
                "status": alert.get("status"),
                "type": alert.get("anomaly_type")
            })


        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(
                formatted_alerts,
                cls=DecimalEncoder
            )
        }


    except Exception as e:
        print("ERROR:", str(e))
        return {
            "statusCode":500,
            "headers":headers,
            "body":json.dumps({
                "error":str(e)

            })

        }