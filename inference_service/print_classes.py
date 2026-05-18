import json
from ultralytics import YOLO
from pathlib import Path
import logging

# Disable ultralytics logging
logging.getLogger("ultralytics").setLevel(logging.ERROR)

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "model" / "best.pt"

try:
    model = YOLO(str(MODEL_PATH))
    print(f"JSON_START:{json.dumps(model.names)}:JSON_END")
except Exception as e:
    print(f"ERROR: {e}")
