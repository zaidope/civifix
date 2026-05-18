import json
from ultralytics import YOLO
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "model" / "best.pt"
model = YOLO(str(MODEL_PATH))

with open(BASE_DIR / "classes.txt", "w") as f:
    f.write(json.dumps(model.names))
