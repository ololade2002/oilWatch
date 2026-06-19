import time
import json
import random
from datetime import datetime
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

# 1. NETWORKING & SECURITY CONFIGURATION
CLIENT_ID = "oilwatch-simulator"
ENDPOINT = "a22k2i8pezd38c-ats.iot.us-east-1.amazonaws.com" 

PATH_TO_ROOT_CA = "backend/certs/AmazonRootCA1.pem"
PATH_TO_CERT = "backend/certs/certificate.pem.crt"      
PATH_TO_PRIVATE_KEY = "backend/certs/private.pem.key"   

print("Connecting to AWS IoT Core Ingestion Engine...")
mqtt_client = AWSIoTMQTTClient(CLIENT_ID)
mqtt_client.configureEndpoint(ENDPOINT, 8883)
mqtt_client.configureCredentials(PATH_TO_ROOT_CA, PATH_TO_PRIVATE_KEY, PATH_TO_CERT)

mqtt_client.connect()
print("Secure Connection Established!")

# 2. REAL-TIME MULTI-ASSET SIMULATION LOOP
assets_config = [
    {
        "id": "ALPHA_1",
        "type": "wellhead",
        "limits": {"press": (1350.0, 1450.0), "flow": (470.0, 500.0), "temp": (78.0, 82.0)}
    },
    {
        "id": "ALPHA_2",
        "type": "wellhead",
        "limits": {"press": (1000.0, 1150.0), "flow": (200.0, 300.0), "temp": (70.0, 75.0)}
    },
    {
        "id": "ALPHA_3",
        "type": "wellhead",
        "limits": {"press": (1200.0, 1450.0), "flow": (300.0, 450.0), "temp": (72.0, 88.0)}
    },
    {
        "id": "MANIFOLD_ALPHA",
        "type": "facility",
        "limits": {"press": (900.0, 1100.0), "flow": (970.0, 1400.0), "temp": (65.0, 70.0)}
    },
    {
        "id": "SEPARATOR_ALPHA",
        "type": "facility",
        "limits": {"press": (150.0, 250.0), "flow": (0.0, 0.0), "temp": (45.0, 55.0)}
    }
]

loop_count = 0
print(" Simulation Active. Watching for the cycle anomaly pulse...")

try:
    while True:
        loop_count += 1
        
        # FIX: Generate a clean integer timestamp number that won't crash your main pipeline
        numeric_timestamp = int(time.time())
        
        is_spike_loop = (loop_count % 3 == 0)
        total_well_flow = 0.0
        
        for asset in assets_config:
            raw_id = asset["id"]
            telemetry_type = asset["type"]
            limits = asset["limits"]
            
            prefix = "WELLHEAD#" if telemetry_type == "wellhead" else "FACILITY#"
            full_pk_id = f"{prefix}{raw_id}"
            
            # 1. WELLHEAD SIMULATION
            if telemetry_type == "wellhead":
                metrics = {
                    "wellhead_pressure_psi": round(random.uniform(limits["press"][0], limits["press"][1]), 2),
                    "flow_rate_bbl_day": round(random.uniform(limits["flow"][0], limits["flow"][1]), 2),
                    "temperature_c": round(random.uniform(limits["temp"][0], limits["temp"][1]), 2)
                }
                
                if "ALPHA_2" in raw_id:
                    metrics["water_cut_percentage"] = round(random.uniform(65.0, 85.0), 2)
                
                if "ALPHA_3" in raw_id and is_spike_loop:
                    print(f"  [ANOMALY] Injecting Wellhead Alpha-3 Pressure Spike!")
                    metrics["wellhead_pressure_psi"] = round(random.uniform(1580.0, 1660.0), 2)
                
                total_well_flow += metrics["flow_rate_bbl_day"]

            # 2. MANIFOLD SIMULATION
            elif "MANIFOLD" in raw_id:
                metrics = {
                    "manifold_pressure_psi": round(random.uniform(limits["press"][0], limits["press"][1]), 2),
                    "total_combined_flow_bbl_day": round(total_well_flow, 2), 
                    "temperature_c": round(random.uniform(limits["temp"][0], limits["temp"][1]), 2)
                }

            # 3. SEPARATOR SIMULATION
            elif "SEPARATOR" in raw_id:
                metrics = {
                    "vessel_pressure_psi": round(random.uniform(limits["press"][0], limits["press"][1]), 2),
                    "bulk_oil_bbl_day": round(random.uniform(800.0, 1100.0), 2),
                    "produced_water_bbl_day": round(random.uniform(300.0, 500.0), 2),
                    "associated_gas_mscf_day": round(random.uniform(1500.0, 2200.0), 2),
                    "temperature_c": round(random.uniform(limits["temp"][0], limits["temp"][1]), 2),
                    "oil_level_percentage": round(random.uniform(55.0, 68.0), 2)
                }
                
                if is_spike_loop:
                    print(f"  [ANOMALY] Injecting Separator Alpha Pressure Spike!")
                    metrics["vessel_pressure_psi"] = round(random.uniform(1420.0, 1490.0), 2)
                    metrics["oil_level_percentage"] = round(random.uniform(78.0, 84.0), 2)

            live_pressure = (
                metrics.get("wellhead_pressure_psi") or 
                metrics.get("manifold_pressure_psi") or 
                metrics.get("vessel_pressure_psi") or 
                "N/A"
            )
            
            payload = {
                "asset_id": full_pk_id,
                "raw_asset_id": raw_id,
                "timestamp": numeric_timestamp,  # Fixed clean integer variable
                "telemetry_type": telemetry_type,
                "metrics": metrics
            }
            
            topic = f"oilwatch/telemetry/{telemetry_type}"
            mqtt_client.publish(topic, json.dumps(payload), 1)
            
            print(f"  Broadcast Sent to {topic} for {full_pk_id} | Pressure: {live_pressure}")
            time.sleep(0.3)
            
        print(f"---  Complete Field Scan {loop_count} Saved to Cloud ---")
        time.sleep(10)

except KeyboardInterrupt:
    print("\n Simulator stopped manually.")
    mqtt_client.disconnect()