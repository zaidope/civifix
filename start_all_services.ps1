# 1. Authority Intelligence Engine Ingestion (Runs once and stays open for logs)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$Host.UI.RawUI.WindowTitle = 'Authority Ingestion Engine'; cd 'c:\Users\Zaid Azeemulla\Desktop\AI-powered-Local-Governance-and-Citizen-Engagement\Backend'; $env:PYTHONIOENCODING='utf-8'; echo 'Starting MLA Ingestion...'; python scripts/ingest_mlas.py; echo 'Starting ULB Ingestion...'; python scripts/ingest_ulbs.py; echo 'Ingestion Complete! Keep this window open for logs.'"

# 2. AI Inference Service (FastAPI)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$Host.UI.RawUI.WindowTitle = 'AI Inference Service'; cd 'c:\Users\Zaid Azeemulla\Desktop\AI-powered-Local-Governance-and-Citizen-Engagement\inference_service'; .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 9000"

# 3. Node.js Backend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$Host.UI.RawUI.WindowTitle = 'Backend Server'; cd 'c:\Users\Zaid Azeemulla\Desktop\AI-powered-Local-Governance-and-Citizen-Engagement\Backend'; node server.js"

# 4. React Web Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$Host.UI.RawUI.WindowTitle = 'React Web Frontend'; cd 'c:\Users\Zaid Azeemulla\Desktop\AI-powered-Local-Governance-and-Citizen-Engagement'; npm start"

# 5. Expo Mobile App
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$Host.UI.RawUI.WindowTitle = 'Expo Mobile App'; cd 'c:\Users\Zaid Azeemulla\Desktop\civifixer\MobileApp'; npx expo start"

