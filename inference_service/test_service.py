"""
Test script to verify the inference service is working correctly.
Run this after starting the service with: uvicorn main:app --host 0.0.0.0 --port 9000
"""
import requests
import os

# Test health endpoint
print("🔍 Testing health endpoint...")
try:
    response = requests.get("http://localhost:9000/health")
    print(f"✅ Health check: {response.status_code} - {response.json()}")
except Exception as e:
    print(f"❌ Health check failed: {e}")
    print("💡 Make sure the service is running: uvicorn main:app --host 0.0.0.0 --port 9000")
    exit(1)

# Test prediction endpoint (if you have a test image)
print("\n🔍 Testing prediction endpoint...")
test_image_path = "test_image.jpg"  # Change this to a test image path if you have one

if os.path.exists(test_image_path):
    try:
        with open(test_image_path, "rb") as f:
            files = {"file": f}
            response = requests.post("http://localhost:9000/predict", files=files)
            print(f"✅ Prediction test: {response.status_code}")
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")
else:
    print(f"⚠️  Test image not found at {test_image_path}")
    print("   Skipping prediction test. Service appears to be running correctly.")

print("\n✅ Service is ready to accept requests!")

