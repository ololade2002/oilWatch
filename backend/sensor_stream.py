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

# 2. INITIALIZE AND CONFIGURE THE MQTT CLIENT
print("Connecting to AWS IoT Core Ingestion Engine...")
mqtt_client = AWSIoTMQTTClient(CLIENT_ID)
mqtt_client.configureEndpoint(ENDPOINT, 8883)
mqtt_client.configureCredentials(PATH_TO_ROOT_CA, PATH_TO_PRIVATE_KEY, PATH_TO_CERT)

# Establish connection
mqtt_client.connect()
print("Secure Connection Established!")

# 3. REAL-TIME MULTI-ASSET SIMULATION LOOP
# Tailored limits for upstream wells and downstream processing assets
assets_config = [
    {
        "id": "ALPHA_1",
        "type": "wellhead",
        "limits": {"press": (1350.0, 1450.0), "flow": (470.0, 500.0), "temp": (78.0, 82.0)}
    },
    {
        "id": "ALPHA_2",
        "type": "wellhead",
        "limits": {"press": (1000.0, 1150.0), "flow": (200.0, 300.0), "temp": (70.0, 75.0)} # Aging indicators
    },
    {
        "id": "ALPHA_3",
        "type": "wellhead",
        "limits": {"press": (1200.0, 1650.0), "flow": (300.0, 600.0), "temp": (72.0, 88.0)} # Volatile / high pressure
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

print("OilWatch Digital Oilfield Simulation Active. Broadcasting telemetry...")

try:
    while True:
        current_timestamp = str(int(time.time()))
        
        # Cycle through all configured field assets in a single operational scan
        for asset in assets_config:
            asset_id = asset["id"]
            telemetry_type = asset["type"]
            limits = asset["limits"]
            
            # Map parameters dynamically based on asset type definitions
            if asset_id == "SEPARATOR_ALPHA":
                metrics = {
                    "vessel_pressure_psi": round(random.uniform(limits["press"][0], limits["press"][1]), 2),
                    "bulk_oil_bbl_day": round(random.uniform(800.0, 1100.0), 2),
                    "produced_water_bbl_day": round(random.uniform(300.0, 500.0), 2),
                    "associated_gas_mscf_day": round(random.uniform(1500.0, 2200.0), 2),
                    "temperature_c": round(random.uniform(limits["temp"][0], limits["temp"][1]), 2)
                }
            elif asset_id == "MANIFOLD_ALPHA":
                metrics = {
                    "manifold_pressure_psi": round(random.uniform(limits["press"][0], limits["press"][1]), 2),
                    "total_combined_flow_bbl_day": round(random.uniform(limits["flow"][0], limits["flow"][1]), 2),
                    "temperature_c": round(random.uniform(limits["temp"][0], limits["temp"][1]), 2)
                }
            else:
                # Upstream wellhead structural maps
                metrics = {
                    "wellhead_pressure_psi": round(random.uniform(limits["press"][0], limits["press"][1]), 2),
                    "flow_rate_bbl_day": round(random.uniform(limits["flow"][0], limits["flow"][1]), 2),
                    "temperature_c": round(random.uniform(limits["temp"][0], limits["temp"][1]), 2)
                }
                
                # Injected feature anomaly mapping for mature well testing
                if asset_id == "ALPHA_2":
                    metrics["water_cut_percentage"] = round(random.uniform(65.0, 85.0), 2)
            
            # Structure standard unified telemetry message package
            payload = {
                "asset_id": asset_id,
                "timestamp": current_timestamp,
                "telemetry_type": telemetry_type,
                "metrics": metrics
            }
            
            # Publish payload dynamically to specific topic endpoints
            topic = f"oilwatch/telemetry/{telemetry_type}"
            mqtt_client.publish(topic, json.dumps(payload), 1)
            
            print(f"Broadcast Sent to {topic} for {asset_id}")
            
            # Small pace brief spacing to prevent package collision over mTLS network
            time.sleep(0.5)
            
        print("--- Complete Field Scan Saved to Cloud ---")
        # Rest interval duration between operational loop cycles (10 seconds)
        time.sleep(10)

except KeyboardInterrupt:
    print("\n Simulator stopped manually.")
    mqtt_client.disconnect()