# Installation Guide

## Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) PostgreSQL 14+

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows
pip install -r requirements.txt
alembic upgrade head
python seed.py
```

Create `backend/.env` (optional):

```env
DATABASE_URL=sqlite:///./focus_sessions.db
SECRET_KEY=replace-with-a-long-random-string
CORS_ORIGINS=http://localhost:5173
```

Start API:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Frontend setup

From project root:

```bash
cd frontend
npm install
npm run dev
```

## Production build

```bash
npm run build
# Serve dist/ with any static host; API must be reachable at /api or configure VITE_API_URL
```

## Tests

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend && pytest

## One-command setup

From Windows Command Prompt:

```cmd
setup.cmd
start.cmd
```
```
