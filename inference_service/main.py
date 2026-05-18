import io
import json
import os
from pathlib import Path
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent
# YOLOv8 usually uses a .pt file. We expect a file named 'best.pt' in the model folder.
# If you have a classification model, use 'best.pt'. 
# If it's a detection model, it will also work.
MODEL_PATH = BASE_DIR / "model" / "best.pt"

# Load YOLO model
print(f"[INFO] Loading YOLOv8 model from: {MODEL_PATH}")
try:
    # Check if model exists, if not, it might try to download a default one
    if not MODEL_PATH.exists():
        print(f"[WARNING] {MODEL_PATH} not found. Using yolov8n.pt as fallback.")
        model = YOLO("yolov8n.pt") 
    else:
        model = YOLO(str(MODEL_PATH))
    print("[SUCCESS] YOLOv8 model loaded successfully")
except Exception as e:
    print(f"[ERROR] Error loading YOLOv8 model: {e}")
    raise

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "message": "YOLOv8 Inference service is running"}

@app.post("/predict")
def predict(file: UploadFile = File(...)):
    try:
        print(f"[INFO] Received prediction request for file: {file.filename}")

        # Read image
        image_data = file.file.read()
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        image_width, image_height = img.size

        # Predict using YOLOv8
        # stream=True is more memory efficient for single images
        results = model.predict(source=img, save=False)

        # Assuming classification model (yolov8-cls)
        # If it's a detection model, 'results[0].probs' will be None.
        result = results[0]

        label = "none"
        confidence = 0.0
        bbox_payload = None

        if hasattr(result, "probs") and result.probs is not None:
            # Classification logic
            top1_idx = result.probs.top1
            label = result.names[top1_idx]
            confidence = float(result.probs.top1conf)
        else:
            # Detection logic (fallback or primary)
            # If it's a detection model, we take the highest confidence detection
            if len(result.boxes) > 0:
                # Sort boxes by confidence (keep existing behavior)
                top_box = sorted(result.boxes, key=lambda x: x.conf, reverse=True)[0]
                label = result.names[int(top_box.cls)]
                confidence = float(top_box.conf)

                # Extract bounding box coordinates (x1, y1, x2, y2)
                try:
                    x1, y1, x2, y2 = top_box.xyxy[0].tolist()
                    bbox_payload = {
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                    }
                except Exception as bbox_err:
                    print(f"[WARNING] Failed to extract bbox: {bbox_err}")
                    bbox_payload = None

        print(f"[SUCCESS] Prediction: {label} (confidence: {confidence:.4f})")

        return {
            "label": label,
            "confidence": confidence,
            "bbox": bbox_payload,
            "image_width": image_width,
            "image_height": image_height,
        }
    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Prediction error: {error_msg}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": error_msg, "type": type(e).__name__}
        )