import json
import boto3
import os
import math
from decimal import Decimal
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb")

READINGS_TABLE = os.environ["READINGS_TABLE"]
PIPELINES_TABLE = os.environ["PIPELINE_TABLE"]

readings_table = dynamodb.Table(READINGS_TABLE)
pipelines_table = dynamodb.Table(PIPELINES_TABLE)

def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def to_decimal(value):
    return Decimal(str(value))


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Content-Type": "application/json"
        },
        "body": json.dumps(body, default=decimal_serializer)
    }


def calculate_pipeline_values(inlet_pressure, outlet_pressure, flow_rate, pipeline):

    # Get pipeline properties
    length_m = float(pipeline["lengthM"])
    diameter_m = float(pipeline["innerDiameterM"])
    density = float(pipeline["densityKgM3"])
    roughness_m = float(pipeline["roughnessM"])
    viscosity = float(pipeline["dynamicViscosityPaS"])

    # Measured ΔP (PSI)
    measured_dp_psi = float(inlet_pressure) - float(outlet_pressure)

    # Area
    area = math.pi * (diameter_m ** 2) / 4.0

    # Velocity
    velocity = float(flow_rate) / area

    # Reynolds number
    reynolds_number = (density * velocity * diameter_m) / viscosity

    # Friction factor
    if reynolds_number < 2300:
        friction_factor = 64 / reynolds_number
    else:
        friction_factor = 0.25 / (
            math.log10((roughness_m / diameter_m) / 3.7 + 5.74 / (reynolds_number ** 0.9)) ** 2
        )

    # Darcy-Weisbach (Pa)
    expected_dp_pa = friction_factor * (length_m / diameter_m) * (density * velocity ** 2 / 2.0)

    # Convert to PSI
    expected_dp_psi = expected_dp_pa / 6894.76

    return measured_dp_psi, expected_dp_psi


def ingestReading(event, context):
    try:
        body = json.loads(event["body"])

        asset_id = body.get("assetId")
        asset_type = body.get("assetType")
        operator_name = body.get("operatorName")
        timestamp = datetime.now(timezone.utc).isoformat()

        if not asset_id or not asset_type:
            return response(400, {"message": "assetId and assetType are required"})
        
        if not operator_name:
            return response(400, {"message": "operatorName is required"})


        item = {
            "assetId": asset_id,
            "assetType": asset_type,
            "timestamp": timestamp,
            "operatorName": operator_name
        }

        # ---------- WELL ----------
        if asset_type == "well":

            pressure = body.get("pressure")
            flow = body.get("flowRate")
            temp = body.get("temperature")

            if not all([pressure, flow, temp]):
                return response(400, {"message": "Missing well fields"})

            item["pressure"] = to_decimal(pressure)
            item["flowRate"] = to_decimal(flow)
            item["temperature"] = to_decimal(temp)

        # ---------- PIPELINE ----------
        elif asset_type == "pipeline":

            inlet = body.get("inletPressure")
            outlet = body.get("outletPressure")
            flow = body.get("flowRate")
            temp = body.get("temperature")

            if not all([inlet, outlet, flow, temp]):
                return response(400, {"message": "Missing pipeline fields"})

            pipeline_response = pipelines_table.get_item(
                Key={"pipelineId": asset_id}
            )

            pipeline = pipeline_response.get("Item")

            if not pipeline:
                return response(404, {"message": "Pipeline not found"})

            measured_dp_psi, expected_dp_psi = calculate_pipeline_values(
                inlet, outlet, flow, pipeline
            )

            item.update({
                "inletPressurePsi": to_decimal(inlet),
                "outletPressurePsi": to_decimal(outlet),
                "flowRate": to_decimal(flow),
                "temperature": to_decimal(temp),
                "measuredDpPsi": to_decimal(measured_dp_psi),
                "expectedDpPsi": to_decimal(expected_dp_psi)
            })

        else:
            return response(400, {"message": "assetType must be 'well' or 'pipeline'"})

        readings_table.put_item(Item=item)

        return response(200, {
            "message": "Reading stored successfully",
            "data": item
        })

    except Exception as e:
        return response(500, {
            "message": "Internal server error",
            "error": str(e)
        })