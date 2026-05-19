@echo off
setlocal

cd /d "%~dp0"

echo Building frontend...
cd frontend
npm run build
if errorlevel 1 exit /b 1

cd /d "%~dp0"

echo Verifying backend imports...
cd backend
call venv\Scripts\activate
python -m compileall app
if errorlevel 1 exit /b 1
call deactivate

echo Build checks complete
