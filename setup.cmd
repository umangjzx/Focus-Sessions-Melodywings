@echo off
setlocal

cd /d "%~dp0"

echo [1/3] Backend setup
cd backend
if not exist venv (
  python -m venv venv
)
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if not exist .env if exist .env.example copy .env.example .env
set PYTHONPATH=.
alembic upgrade head
python seed.py
call deactivate

cd /d "%~dp0"

echo [2/3] Frontend setup
cd frontend
npm install

cd /d "%~dp0"

echo [3/3] Setup complete
pause
