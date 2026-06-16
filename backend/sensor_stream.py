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
print("🔄 Connecting to AWS IoT Core Ingestion Engine...")
mqtt_client = AWSIoTMQTTClient(CLIENT_ID)
mqtt_client.configureEndpoint(ENDPOINT, 8883)
mqtt_client.configureCredentials(PATH_TO_ROOT_CA, PATH_TO_PRIVATE_KEY, PATH_TO_CERT)

# Establish connection
mqtt_client.connect()
print("✅ Secure Connection Established!")

# 3. REAL-TIME SIMULATION LOOP
try:
    while True:
        # Generate current Unix timestamp
        current_timestamp = str(int(time.time()))
        
        # Structure the industrial JSON payload
        payload = {
            "asset_id": "WELL_01_ALPHA",
            "timestamp": current_timestamp,
            "telemetry_type": "wellhead",
            "metrics": {
                "wellhead_pressure_psi": round(random.uniform(1200.0, 1500.0), 2),
                "flow_rate_bbl_day": round(random.uniform(450.0, 500.0), 2),
                "temperature_c": round(random.uniform(75.0, 85.0), 2)
            }
        }
        
        # Set the dynamic topic path (Pre-fixed with Thing Name to match IoT Policy)
        topic = f"oilwatch/telemetry/wellhead"
        
        # Publish the data payload to AWS IoT Core
        mqtt_client.publish(topic, json.dumps(payload), 1)
        
        print(f"📡 Broadcast Sent to {topic}: Pressure = {payload['metrics']['wellhead_pressure_psi']} PSI")
        
        # Stream data interval (10 seconds)
        time.sleep(10)

except KeyboardInterrupt:
    print("\n🛑 Simulator stopped manually.")
    mqtt_client.disconnect()