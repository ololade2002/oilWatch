import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")

FORECAST_TABLE_NAME = os.environ.get("FORECAST_TABLE_NAME")
table = dynamodb.Table(FORECAST_TABLE_NAME)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Content-Type": "application/json"
}

class DecimalEncoder(json.JSONEncoder):
    def default(self,obj):
        if isinstance(obj,Decimal):
            return float(obj)
        return super().default(obj)


def getForecast_handler(event,context):
    try:
        if event.get("requestContext",{}).get("http",{}).get("method") == "OPTIONS":
            return {
                "statusCode":200,
                "headers":CORS_HEADERS,
                "body":""
            }

        params = event.get("queryStringParameters") or {}

        asset_id = params.get("asset_id","ALPHA_2").upper()

        dynamo_asset_id = f"WELL#WELLHEAD#{asset_id}"

        response = table.query(
            KeyConditionExpression=Key("asset_id").eq(dynamo_asset_id),
            ScanIndexForward=False,
            Limit=1
        )

        items = response.get("Items",[])

        if not items:
            return {
                "statusCode":404,
                "headers":CORS_HEADERS,
                "body":json.dumps({
                    "message":"No forecast found for this asset"
                })
            }

        forecast_data = items[0]

        return {
            "statusCode":200,
            "headers":CORS_HEADERS,
            "body":json.dumps({
                "asset_id":asset_id,
                "model":forecast_data.get("model","Arps hyperbolic decline"),
                "generated_at":forecast_data.get("generated_at"),
                "current_rate":forecast_data.get("current_rate"),
                "projected_day180":forecast_data.get("projected_day180"),
                "parameters":{
                    "qi":forecast_data.get("qi"),
                    "Di":forecast_data.get("Di"),
                    "b":forecast_data.get("b")
                },
                "forecast":forecast_data.get("forecast",[])
            },cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Get Forecast Error: {str(e)}")

        return {
            "statusCode":500,
            "headers":CORS_HEADERS,
            "body":json.dumps({
                "error":str(e)
            })
        }