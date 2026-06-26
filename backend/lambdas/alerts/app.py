import json
import boto3
import os
import uuid
from boto3.dynamodb.types import TypeDeserializer
from boto3.dynamodb.conditions import Key

# INITIALIZE AWS CLIENTS
sns_client = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

SNS_TOPIC_ARN = os.environ.get("ALERT_TOPIC_SNS") or ""
ALERTS_TABLE = os.environ.get("ALERTS_TABLE") or "OilWatchAlertsTable"

try:
    alerts_table = dynamodb.Table(ALERTS_TABLE)
except Exception as init_err:
    print(f"Warning: Table initialization delayed: {str(init_err)}")

deserializer = TypeDeserializer()


def deserialize_image(image):
    return {k: deserializer.deserialize(v) for k, v in image.items()}


def alerts_handler(event, context):
    try:
        print("Received DynamoDB Stream Event Batch...")

        for record in event.get('Records', []):
            if record['eventName'] in ['INSERT', 'MODIFY']:

                # 1. DESERIALIZE THE DATABASE STREAM ROW
                dynamodb_json = record['dynamodb']['NewImage']
                item = deserialize_image(dynamodb_json)

                asset_id = item.get("raw_asset_id") or item.get(
                    "asset_id") or "UNKNOWN_ASSET"
                telemetry_type = item.get("telemetry_type", "unknown")
                metrics = item.get("metrics", {})

                raw_timestamp = item.get("timestamp", "Unknown Time")
                clean_time = str(raw_timestamp).replace("TS#", "")

                current_value = None
                ceiling_value = 1500.0
                severity = "Warning"
                message = ""
                is_breached = False

                # 2. EVALUATE METRICS WITH DUAL THRESHOLDS
                if "wellhead_pressure_psi" in metrics:
                    current_value = float(metrics["wellhead_pressure_psi"])

                    if current_value > 1500.0:
                        is_breached = True
                        severity = "Critical"
                        message = "CRITICAL: Wellhead pressure breached safety ceiling — check downstream valve loops on Manifold Alpha."
                    elif current_value > 1450.0:  # Pre-ceiling warning zone
                        is_breached = True
                        severity = "Warning"
                        message = "WARNING: Wellhead pressure trending high. Monitor closely."

                elif "manifold_pressure_psi" in metrics:
                    current_value = float(metrics["manifold_pressure_psi"])

                    if current_value > 1450.0:
                        is_breached = True
                        severity = "Critical"
                        message = "CRITICAL: Manifold pressure exceeds gathering system limits — adjust pressure control regulator."
                    elif current_value > 1400.0:
                        is_breached = True
                        severity = "Warning"
                        message = "WARNING: Manifold pressure approaching high operating boundaries."

                elif "vessel_pressure_psi" in metrics:
                    current_value = float(metrics["vessel_pressure_psi"])

                    if current_value > 1400.0:
                        is_breached = True
                        severity = "Critical"
                        message = "CRITICAL: Separator pressure approaching high operating limit — verify gas flare line valve alignment."
                    elif current_value > 1350.0:
                        is_breached = True
                        severity = "Warning"
                        message = "WARNING: Vessel pressure building up. Inspect vent outputs."

                # Separate check block for fluid capacity (Evaluated independently of pressure)
                if "oil_level_percentage" in metrics:
                    current_level = float(metrics["oil_level_percentage"])
                    if current_level > 75.0:
                        is_breached = True
                        severity = "Warning"
                        current_value = current_level
                        ceiling_value = 75.0
                        message = "Oil level trending high — monitor for liquid carry-over into gas export line."
                    current_level = float(metrics["oil_level_percentage"])
                    if current_level > 75.0:
                        is_breached = True
                        severity = "Warning"
                        current_value = current_level
                        ceiling_value = 75.0
                        message = "Oil level trending high — monitor for liquid carry-over into gas export line."

                # 3. ALARM EXECUTION & THROTTLING LOGIC
                if is_breached:
                    print(f"{severity.upper()} VIOLATION detected for {asset_id}!")

                    # Check DynamoDB if this asset already has an active alert to prevent spamming emails
                    already_notified = False
                    try:
                        # Scan the table for any existing active alerts for this specific asset
                        response = alerts_table.scan(
                            FilterExpression=boto3.dynamodb.conditions.Attr('asset_id').eq(asset_id) &
                            boto3.dynamodb.conditions.Attr(
                                'status').eq('ACTIVE')
                        )
                        if response.get('Items'):
                            already_notified = True
                            print(
                                f"Active alert already exists for {asset_id}. Suppressing duplicate email notification.")
                    except Exception as scan_err:
                        print(
                            f"Could not check active alert states: {str(scan_err)}")

                    authorizer_context = event.get(
                        'requestContext', {}).get('authorizer', {})
                    user_email = authorizer_context.get('claims', {}).get(
                        'email', 'shift_supervisor@oilwatch.com')
                    alert_id = str(uuid.uuid4())

                    # A. WRITE TO DYNAMODB ALERTS TABLE (Always update table so UI stays fresh)
                    try:
                        alerts_table.put_item(
                            Item={
                                'alert_id': alert_id,
                                'timestamp': clean_time,
                                'asset_id': asset_id,
                                'severity': severity,
                                'message': message,
                                'observed_value': str(current_value),
                                'ceiling_value': str(ceiling_value),
                                'status': 'ACTIVE'
                            }
                        )
                        print(f"Alert record updated in DynamoDB table.")
                    except Exception as db_err:
                        print(
                            f"Non-fatal database write failure: {str(db_err)}")

                    # B. DISPATCH NOTIFICATION VIA SNS (Only if we haven't already emailed about it!)
                    if SNS_TOPIC_ARN and not already_notified:
                        try:
                            alert_subject = f"⚠️ OilWatch ALERT: {severity} Anomaly on {asset_id}"
                            alert_body = (
                                f"OILWATCH DIGITAL OILFIELD ALARM ENGINE\n"
                                f"=========================================\n"
                                f"Asset Identifier:  {asset_id}\n"
                                f"Asset Type:        {telemetry_type.upper()}\n"
                                f"Severity Level:    {severity.upper()}\n"
                                f"Observed Metric:   {current_value}\n"
                                f"Safety Target:     {ceiling_value}\n"
                                f"Incident Time:     {clean_time}\n"
                                f"Assigned Operator: {user_email}\n"
                                f"=========================================\n"
                                f"Action Protocol:   {message}"
                            )

                            sns_client.publish(
                                TopicArn=SNS_TOPIC_ARN,
                                Message=alert_body,
                                Subject=alert_subject,
                                MessageAttributes={
                                    'target_operator_email': {
                                        'DataType': 'String',
                                        'StringValue': user_email
                                    }
                                }
                            )
                            print(
                                f"First-occurrence notification routed successfully to operator.")
                        except Exception as sns_err:
                            print(
                                f"Non-fatal SNS dispatch failure: {str(sns_err)}")
                    elif not SNS_TOPIC_ARN:
                        print("Notification skipped: ALERT_TOPIC_SNS ARN missing.")
                else:
                    print(
                        f"Telemetry for {asset_id} is within stable operational tolerances.")

        return {"statusCode": 200, "body": json.dumps("Stream processing loop executed cleanly.")}

    except Exception as e:
        print(f"Critical Failure inside Alert Processing Layer: {str(e)}")
        return {"statusCode": 500, "body": json.dumps("Alert worker process failed.")}
