from ultralytics import YOLO
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "model" / "best.pt"

print(f"Loading {MODEL_PATH}")
model = YOLO(str(MODEL_PATH))

print(f"Task: {model.task}")
print(f"Names: {model.names}")
