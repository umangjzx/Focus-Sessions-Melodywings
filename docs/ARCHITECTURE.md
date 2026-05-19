# Architecture

```
Browser (React SPA)
       │  HTTPS / REST + JWT
       ▼
FastAPI Application
       │
       ▼
SQLAlchemy ORM ──► SQLite / PostgreSQL
```

## Frontend

- **Vite** bundles the React SPA
- **Zustand** stores auth and session UI state
- **Axios** client in `src/services/api.ts` with JWT interceptor
- Dev proxy forwards `/api` to port 8000

## Backend

- **FastAPI** routers per domain (`auth`, `tasks`, `sessions`, `analytics`)
- **JWT** issued on register/login via `python-jose`
- **Services** layer for productivity scoring and achievements
- **Alembic** for migrations and schema validation

## Security

- Passwords hashed with bcrypt
- Stateless JWT sessions
- CORS restricted to configured origins

## Productivity score

```
score = (completion_% × 0.5) + (task_completed ? 30 : 0) + (mood × 4)
```
