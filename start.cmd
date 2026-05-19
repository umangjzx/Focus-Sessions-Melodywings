@echo off
setlocal

cd /d "%~dp0"

start "Focus Sessions API" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
start "Focus Sessions Web" cmd /k "cd frontend && npm run dev"
start "Open Focus Sessions" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"
