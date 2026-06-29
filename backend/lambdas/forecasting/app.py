

import json
import os
import math
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb")

TELEMETRY_TABLE = os.environ.get("TELEMETRY_TABLE_NAME")
FORECAST_TABLE  = os.environ.get("FORECAST_TABLE_NAME")

telemetry_table = dynamodb.Table(TELEMETRY_TABLE)
forecast_table  = dynamodb.Table(FORECAST_TABLE)

CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Content-Type": "application/json",
}

FORECAST_DAYS  = 180   # 6-month projection
HISTORY_LIMIT  = 200   # max readings to pull for curve fitting


# DynamoDB Decimal serialiser 
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


#  fetch flow rate history from DynamoDB 
def fetch_flow_history(asset_id: str):

    # Your DynamoDB value is:
    # WELL#WELLHEAD#ALPHA_2

    asset_key = f"WELL#WELLHEAD#{asset_id}"

    response = telemetry_table.query(
        KeyConditionExpression=Key("asset_id").eq(asset_key),
        ScanIndexForward=True,
        Limit=HISTORY_LIMIT
    )

    items = response.get("Items", [])

    points = []

    for item in items:

        metrics = item.get("metrics", {})

        flow = metrics.get(
            "flow_rate_bbl_day"
        )

        timestamp = item.get(
            "timestamp",
            ""
        )

        if flow is not None:

            points.append({
                "timestamp": timestamp,
                "rate": float(flow)
            })

    return points

#  Arps hyperbolic decline curve fit 
def fit_arps(history):

    if len(history) < 3:
        return None

    qi = history[-1]["rate"]
    q_previous = history[0]["rate"]

    if qi <= 0 or q_previous <= 0:
        return None
    b = 0.5

    days_elapsed = len(history)
    ratio = q_previous / qi

    Di = (
        ((ratio ** b) - 1)
        /
        (b * days_elapsed)
    )

    Di = max(Di, 0.000001)

    # realistic decline limit
    Di = min(Di, 1.0)


    return {
        "qi": qi,
        "Di": Di,
        "b": b
    }
   


#  generate 180-day forecast 
def generate_forecast(params: dict, days: int = FORECAST_DAYS):
    """
    Project production rate forward `days` days using fitted Arps params.
    Returns one data point every 5 days (keeps the payload small).
    """
    qi, Di, b = params["qi"], params["Di"], params["b"]
    forecast  = []

    for day in range(0, days + 1, 5):
        try:
            q_t = qi / ((1 + b * Di * day) ** (1 / b))
        except (ZeroDivisionError, ValueError):
            q_t = 0

        forecast.append({
            "day":      day,
            "rate_bbl": round(max(q_t, 0), 2),
        })

    return forecast


#  save forecast run to OilWatchForecast table 
def save_forecast(asset_id, params, forecast, current_rate, projected_rate):
    
    now = datetime.now(timezone.utc).isoformat()
    try:
        forecast_table.put_item(Item={
            "asset_id": asset_id,
            "timestamp": now,
            "generated_at":      now,
            "current_rate":      Decimal(str(round(current_rate, 2))),
            "projected_day180":  Decimal(str(round(projected_rate, 2))),
            "qi":                Decimal(str(round(params["qi"], 4))),
            "Di":                Decimal(str(round(params["Di"], 8))),
            "b":                 Decimal(str(params["b"])),
            "model":             "Arps hyperbolic",
            "forecast_days":     FORECAST_DAYS,
            "unit":              "bbl/d",
        })
    except Exception as exc:
        # Don't fail the whole request just because the save failed
        print(f"Warning: could not save forecast to {FORECAST_TABLE}: {exc}")


# Lambda handler 
def forecast_handler(event, context):
    try:
        # Handle CORS preflight
        if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

        params       = event.get("queryStringParameters") or {}
        asset_id     = params.get("asset_id", "ALPHA_2").upper().replace("-", "_")

        # 1. Fetch history
        points = fetch_flow_history(asset_id)

        if len(points) < 3:
            return {
                "statusCode": 200,
                "headers":    CORS_HEADERS,
                "body": json.dumps({
                    "asset_id": asset_id,
                    "status":   "insufficient_data",
                    "message":  f"Need at least 3 flow rate readings. Found {len(points)}.",
                    "history":  [],
                    "forecast": [],
                }),
            }

        # 2. Fit Arps curve
        arps = fit_arps(points)

        if arps is None:
            return {
                "statusCode": 200,
                "headers":    CORS_HEADERS,
                "body": json.dumps({
                    "asset_id": asset_id,
                    "status":   "fit_failed",
                    "message":  "Could not fit decline curve — check flow rate values.",
                    "history":  points,
                    "forecast": [],
                }),
            }

        # 3. Generate forecast
        forecast      = generate_forecast(arps)
        current_rate  = points[-1]["rate"]
        projected_rate = forecast[-1]["rate_bbl"]
        decline_pct   = round(((current_rate - projected_rate) / current_rate) * 100, 1) if current_rate > 0 else 0

        # 4. Save run
        save_forecast(asset_id, arps, forecast, current_rate, projected_rate)

        # 5. Return
        return {
            "statusCode": 200,
            "headers":    CORS_HEADERS,
            "body": json.dumps({
                "asset_id":     asset_id,
                "status":       "ok",
                "model":        "Arps hyperbolic decline",
                "parameters": {
                    "qi_bbl_per_day": round(arps["qi"], 2),
                    "Di_per_day":     round(arps["Di"], 6),
                    "b_exponent":     arps["b"],
                },
                "summary": {
                    "current_rate_bbl":   current_rate,
                    "day180_rate_bbl":    projected_rate,
                    "decline_pct":        decline_pct,
                    "history_points_used": len(points),
                },
                "history":  points,    # [{timestamp, rate}, ...] oldest first
                "forecast": forecast,  # [{day, rate_bbl}, ...] 0 to 180
            }, cls=DecimalEncoder),
        }

    except Exception as exc:
        print(f"DCA Engine critical error: {exc}")
        return {
            "statusCode": 500,
            "headers":    CORS_HEADERS,
            "body": json.dumps({"error": str(exc)}),
        }