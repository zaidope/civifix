# Inference Service Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd inference_service
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Verify Model Files Are Present

Make sure these files exist:
- `model/best.pt` (your trained YOLOv8 model)

### 3. Start the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 9000
```

You should see:
```
✅ Loaded X classes: [...]
✅ Model loaded successfully
INFO:     Uvicorn running on http://0.0.0.0:9000
```

### 4. Test the Service (Optional)

In a new terminal:
```bash
cd inference_service
python test_service.py
```

### 5. Keep It Running

**IMPORTANT:** Keep this terminal window open and the service running while you use the web app. The Node.js backend needs this service to be running on port 9000.

## Troubleshooting

### "Connection refused" error
- Make sure the Python service is running on port 9000
- Check that you see "Uvicorn running on http://0.0.0.0:9000" in the terminal

### "Model not found" error
- Verify `model/best.pt` exists in the `inference_service/model/` folder
- Check the file path is correct

## API Endpoints

- `GET /health` - Check if service is running
- `POST /predict` - Upload an image and get prediction

