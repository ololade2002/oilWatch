import json
import boto3
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')

ALERTS_TABLE = os.environ["ALERTS_TABLE"]
WELLS_TABLE = os.environ["WELLS_TABLE"]
SNS_TOPIC_ARN = os.environ["SNS_TOPIC_ARN"]

alerts_table = dynamodb.Table(ALERTS_TABLE)
wells_table = dynamodb.Table(WELLS_TABLE)

# PIPELINE THRESHOLD
MAX_PIPELINE_PRESSURE_PSI = 5000
MIN_PIPELINE_PRESSURE_PSI = 600 
MAX_PIPELINE_TEMP_C = 100
MIN_PIPELINE_TEMP_C = 10 # Below this wax/paraffin deposition
BLOCKAGE_RATIO = 2.0 # If measuredΔP/expectedΔP > 2.0 → BLOCKAGE
LEAK_RATIO = 0.4 # If measuredΔP/expectedΔP < 0.4 → LEAKAGE

# WELL THRESHOLD
MAX_WELL_PRESSURE_PSI = 5500
MAX_WELL_TEMP_C = 120
DEPLETION_PRESSURE_PSI = 1000
MIN_WELL_TEMP_C  = 40     # Below this → abnormal, possible gas kick
SCALING_FLOW_RATIO = 0.5 # If flowRate < 50% of baselineFlowRate → SCALING


def to_float(value):
    if value is None:
        return None
    return float(value)

# Create Alert
def create_alert(asset_id, asset_type, severity, problem, message):
    timestamp = datetime.now(timezone.utc).isoformat()
    alert_id = str(uuid.uuid4())

    alert = {
        "assetId": asset_id,
        "alertId": alert_id,
        "assetType": asset_type,
        "severity": severity,
        "problem": problem,
        "message": message,
        "alertTime": timestamp  
    }

    alerts_table.put_item(Item = alert)
    print(f"Alert saved: [{severity}] {problem} ON {asset_id}")

    sns_client.publish (
        TopicArn = SNS_TOPIC_ARN,
        Subject = f"[{severity}] {problem} DETECTED ON {asset_id}",
        Message = (
            f"Asset : {asset_id}\n"
            f"Type : {asset_type}\n"
            f"Severity : {severity}\n"
            f"Problem : {problem}\n"
            f"Message : {message}\n"
            f"Timestamp : {timestamp}"
        )
    )
    print(f"SNS email sent for {problem} on {asset_id}")

# Pipeline Check
def check_pipeline(reading):
    asset_id = reading["assetId"]

    inlet_pressure = to_float(reading.get("inletPressurePsi"))
    temperature = to_float(reading.get("temperature"))
    measured_dp = to_float(reading.get("measuredDpPsi"))
    expected_dp = to_float(reading.get("expectedDpPsi"))

    if inlet_pressure is not None:
        if inlet_pressure > MAX_PIPELINE_PRESSURE_PSI:
            create_alert(
                asset_id, "Pipeline", "CRITICAL", "OVERPRESSURE",
                f"Inlet pressure is {inlet_pressure} PSI which exceeds the maximum safe limit of {MAX_PIPELINE_PRESSURE_PSI} PSI. Pipe integrity at risk."
            )
        elif inlet_pressure < MIN_PIPELINE_PRESSURE_PSI:
            create_alert(
                asset_id, "Pipeline", "WARNING", "LOW PRESSURE",
                f"Inlet pressure is {inlet_pressure} PSI which is below the minimum safe limit of {MIN_PIPELINE_PRESSURE_PSI} PSI. Possible pump failure, valve closure or upstream supply loss."
            )

    if temperature is not None:
        if temperature > MAX_PIPELINE_TEMP_C:
            create_alert(
                asset_id, "Pipeline", "CRITICAL", "OVERHEATING",
                f"Temperature is {temperature}°C which exceeds the critical limit of {MAX_PIPELINE_TEMP_C}°C for pipeline operations. Possible fluid degradation, pipe stress, or monitoring system fault."
            )
        
        elif temperature < MIN_PIPELINE_TEMP_C:
            create_alert(
                asset_id, "Pipeline", "WARNING", "LOW TEMPERATURE",
                f"Temperatire is {temperature}°C which is below the minimum of {MIN_PIPELINE_TEMP_C}°C. Risk of wax and paraffin deposits forming inside the pipe. "
            )

    if measured_dp is not None and expected_dp is not None and expected_dp > 0:
        ratio = measured_dp / expected_dp

        if ratio > BLOCKAGE_RATIO:
            create_alert(
                asset_id, "Pipeline", "CRITICAL", "BLOCKAGE",
                f"Measured pressure drop ({measured_dp:.1f} PSI) is {ratio:.1f}x the expected ({expected_dp:.1f} PSI). Possible blockage or wax buildup restricting flow"
            )

        elif ratio < LEAK_RATIO:
            create_alert(
                asset_id, "Pipeline", "CRITICAL", "LEAK",
                f"Measured pressure drop ({measured_dp:.1f} PSI) is only {ratio:.0%} of expected ({expected_dp:.1f} PSI). Possible leak — fluid may be escaping the pipeline."
            )

# Well Check
def check_well(reading):
    asset_id = reading["assetId"]

    temperature = to_float(reading.get("temperature"))
    pressure = to_float(reading.get("pressure"))
    flow_rate = to_float(reading.get("flowRate"))

    if temperature is not None:
        if temperature > MAX_WELL_TEMP_C:
            create_alert(
                asset_id, "Well", "CRITICAL", "OVERHEATING",
                f"Temperature is {temperature}°C which exceeds the critical limit of {MAX_WELL_TEMP_C}°C for a producing well. Possible equipment failure, thermal stress, or sensor malfunction."
            )

        elif temperature < MIN_WELL_TEMP_C:
            create_alert(
                asset_id, "Well", "WARNING", "LOW_TEMPERATURE",
                f"Temperature is {temperature}°C which is below the minimum expected of {MIN_WELL_TEMP_C}°C for a producing well. Possible gas kick, abnormal inflow or sensor fault."
            )

    if pressure is not None:
        if pressure > MAX_WELL_PRESSURE_PSI: 
            create_alert(
                asset_id, "Well", "CRITICAL", "OVERPRESSURE",
                f"Well pressure is {pressure} PSI which exceeds the blowout threshold of {MAX_WELL_PRESSURE_PSI} PSI for safe operations. Possible uncontrolled surge, valve failure, or system instability."
            )
        
        elif pressure < DEPLETION_PRESSURE_PSI:
            create_alert(
                asset_id, "Well", "WARNING", "RESERVOIR_DEPLETION",
                f"Well pressure is {pressure} PSI which is below the depletion threshold of {DEPLETION_PRESSURE_PSI} PSI for a producing well. Possible reservoir depletion, reduced inflow, or sensor fault."
            )
       
    if flow_rate is not None:
        well_record = wells_table.get_item(Key={"wellId": asset_id}).get("Item")

        if well_record:
            baseline_flow = to_float(well_record.get("baselineFlowrate"))

            if baseline_flow and baseline_flow > 0:
                flow_ratio = flow_rate / baseline_flow

                if flow_ratio < SCALING_FLOW_RATIO:
                    create_alert(
                        asset_id, "well", "WARNING", "SCALING",
                        f"Flow rate is {flow_rate} m³/s which is only {flow_ratio:.0%} of the baseline ({baseline_flow} m³/s). Possible scaling or blocked perforations."
                    )

        else:
            print(f"No baseline found in WellsTable for {asset_id} — skipping scaling check")

  
# Helps convert dynamodb to pyhton dict
def deserialize(dynamo_item):
    deserializer = boto3.dynamodb.types.TypeDeserializer()
    return {k: deserializer.deserialize(v) for k, v in dynamo_item.items()}

# Rules Engine Function
def rulesEngine(event, context):
    print("Rules engine triggered")

    for record in event.get("Records", []):

        if record.get("eventName") != "INSERT":
            print(f"Skipping — event is {record.get('eventName')}, not INSERT")
            continue

        raw_item = record['dynamodb'].get("NewImage", {})
        reading = deserialize(raw_item)

        print(f"New reading received for: {reading.get('assetId')}")

        asset_type = reading.get("assetType", "").lower().strip()

        if asset_type == "pipeline":
            check_pipeline(reading)

        elif asset_type == "well":
            check_well(reading)

        else:
            print(f"Unknown assetType: {asset_type} — skipping")

    print("Rules engine finished")
