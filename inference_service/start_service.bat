@echo off
echo ========================================
echo Starting Inference Service
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Make sure Python is installed and in your PATH
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM Check if model files exist
echo.
echo Checking model files...
if not exist "model\best.pt" (
    echo ERROR: Model file not found: model\best.pt
    pause
    exit /b 1
)

echo Model files found!
echo.

REM Start the service
echo Starting inference service on port 9000...
echo Press Ctrl+C to stop the service
echo.
uvicorn main:app --host 0.0.0.0 --port 9000

pause

