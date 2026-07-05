import json
import boto3
import os
import uuid
from boto3.dynamodb.types import TypeDeserializer

sns_client    = boto3.client("sns")
dynamodb      = boto3.resource("dynamodb")

SNS_TOPIC_ARN = os.environ.get("ALERT_TOPIC_SNS", "")
ALERTS_TABLE  = os.environ.get("ALERTS_TABLE", "OilWatchAlertsTable")
alerts_table  = dynamodb.Table(ALERTS_TABLE)
deserializer  = TypeDeserializer()


def deserialize_image(image):
    return {k: deserializer.deserialize(v) for k, v in image.items()}


def evaluate_metrics(metrics: dict):
    """
    Evaluates all metrics independently.
    Returns a list of tuples: [(severity, message, current_value, ceiling_value, unit), ...]
    """
    alerts = []

    # 1. Wellhead Pressure Evaluation
    if "wellhead_pressure_psi" in metrics:
        val = float(metrics["wellhead_pressure_psi"])
        if val > 1500.0:
            alerts.append((
                "Critical", 
                "CRITICAL: Wellhead pressure breached safety ceiling — check downstream valve loops on Manifold Alpha.", 
                val, 1500.0, "psi"
            ))
        elif val > 1450.0:
            alerts.append((
                "Warning", 
                "WARNING: Wellhead pressure trending high. Monitor closely.", 
                val, 1450.0, "psi"
            ))

    # 2. Manifold Pressure Evaluation (No longer blocked by elif)
    if "manifold_pressure_psi" in metrics:
        val = float(metrics["manifold_pressure_psi"])
        if val > 1450.0:
            alerts.append((
                "Critical", 
                "CRITICAL: Manifold pressure exceeds gathering system limits.", 
                val, 1450.0, "psi"
            ))
        elif val > 1400.0:
            alerts.append((
                "Warning", 
                "WARNING: Manifold pressure approaching high operating boundaries.", 
                val, 1400.0, "psi"
            ))

    # 3. Vessel Pressure Evaluation (No longer blocked by elif)
    if "vessel_pressure_psi" in metrics:
        val = float(metrics["vessel_pressure_psi"])
        if val > 1400.0:
            alerts.append((
                "Critical", 
                "CRITICAL: Separator pressure approaching high operating limit.", 
                val, 1400.0, "psi"
            ))
        elif val > 1350.0:
            alerts.append((
                "Warning", 
                "WARNING: Vessel pressure building up. Inspect vent outputs.", 
                val, 1350.0, "psi"
            ))

    # 4. Oil Level Evaluation
    if "oil_level_percentage" in metrics:
        val = float(metrics["oil_level_percentage"])
        if val > 75.0:
            alerts.append((
                "Warning", 
                "Oil level trending high — monitor for liquid carry-over into gas export line.", 
                val, 75.0, "%"
            ))

    return alerts


def alerts_handler(event, context):
    try:
        print("Processing DynamoDB Stream batch...")

        for record in event.get("Records", []):
            if record["eventName"] not in ("INSERT", "MODIFY"):
                continue

            item           = deserialize_image(record["dynamodb"]["NewImage"])
            asset_id       = item.get("raw_asset_id") or item.get("asset_id") or "UNKNOWN"
            telemetry_type = item.get("telemetry_type", "unknown")
            metrics        = item.get("metrics", {})
            clean_time     = str(item.get("timestamp", "")).replace("TS#", "").strip()

            # Generate all active breaches from the payload
            generated_alerts = evaluate_metrics(metrics)

            if not generated_alerts:
                print(f"{asset_id} — normal.")
                continue

            # Process each alert sequentially
            for severity, message, current_value, ceiling_value, unit in generated_alerts:
                print(f"{severity.upper()} breach caught: {asset_id} = {current_value} {unit}")

                alert_id = str(uuid.uuid4())

                # 1. Write to DynamoDB
                try:
                    alerts_table.put_item(Item={
                        "alert_id":       alert_id,
                        "timestamp":       clean_time,
                        "asset_id":       asset_id,
                        "severity":       severity,
                        "message":         message,
                        "observed_value": str(current_value),
                        "ceiling_value":  str(ceiling_value),
                        "status":         "ACTIVE",
                        "unit":           unit,
                    })
                    print(f"Alert [{severity}] successfully saved to DynamoDB.")
                except Exception as e:
                    print(f"DynamoDB write failed: {e}")

                # 2. Send Notifications via SNS
                if not SNS_TOPIC_ARN:
                    print("ERROR: ALERT_TOPIC_SNS env var is not set — cannot send email.")
                    continue

                try:
                    subject = f"OilWatch {severity.upper()}: {asset_id}"
                    body = (
                        f"OILWATCH DIGITAL OILFIELD ALARM ENGINE\n"
                        f"=========================================\n"
                        f"Asset:          {asset_id}\n"
                        f"Type:           {telemetry_type.upper()}\n"
                        f"Severity:       {severity.upper()}\n"
                        f"Observed Value: {current_value} {unit}\n"
                        f"Safety Ceiling: {ceiling_value} {unit}\n"
                        f"Time:           {clean_time}\n"
                        f"=========================================\n"
                        f"Action Required: {message}\n"
                    )
                    
                    sns_client.publish(
                        TopicArn=SNS_TOPIC_ARN,
                        Message=body,
                        Subject=subject,
                    )
                    print(f"Notification email dispatched for {asset_id} ({severity}).")
                except Exception as e:
                    print(f"SNS publish failed: {e}")

        return {"statusCode": 200, "body": json.dumps("Done.")}

    except Exception as e:
        print(f"Critical engine failure: {e}")
        return {"statusCode": 500, "body": json.dumps(str(e))}