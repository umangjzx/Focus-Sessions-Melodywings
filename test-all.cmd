@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"
set FAILED=0

echo [1/3] Backend tests
cd backend
call venv\Scripts\activate
set PYTHONPATH=.
set DATABASE_URL=sqlite:///./test.db
if exist test.db del /f /q test.db
alembic upgrade head
pytest
if errorlevel 1 set FAILED=1
call deactivate

cd /d "%~dp0"

echo [2/3] Frontend tests
cd frontend
npm test
if errorlevel 1 set FAILED=1

cd /d "%~dp0"

echo [3/3] Production build
cd frontend
npm run build
if errorlevel 1 set FAILED=1

cd /d "%~dp0"
if %FAILED%==0 (
  echo ALL CHECKS PASSED
  exit /b 0
) else (
  echo ONE OR MORE CHECKS FAILED
  exit /b 1
)
