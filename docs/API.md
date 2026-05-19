# API Documentation

Base URL: `http://localhost:8000/api`

## Authentication

All protected routes require header: `Authorization: Bearer <token>`

### POST /auth/register
```json
{ "name": "Alex", "email": "alex@example.com", "password": "secret123" }
```
Returns `{ "access_token": "...", "token_type": "bearer" }`

### POST /auth/login
```json
{ "email": "alex@example.com", "password": "secret123" }
```

### POST /auth/logout
No body. Client should discard token.

### POST /auth/forgot-password
```json
{ "email": "alex@example.com" }
```

### GET /auth/me
Returns current user profile.

## Tasks

- `GET /tasks` — list tasks
- `POST /tasks` — create task (include `parent_id` to create a subtask)
- `PUT /tasks/{id}` — update task
- `DELETE /tasks/{id}` — delete task and subtasks

## Sessions

- `POST /sessions/start` — start session
- `POST /sessions/{id}/pause` — `{ "pauses": 1 }`
- `POST /sessions/{id}/resume`
- `POST /sessions/{id}/complete` — `{ "actual_minutes", "pauses", "mood", "notes", "task_completed" }`
- `GET /sessions/history`

## Analytics

- `GET /analytics/dashboard`
- `GET /analytics/weekly`
- `GET /analytics/monthly`
- `GET /analytics/heatmap`

## Other

- `GET /achievements`
- `GET /settings` · `PUT /settings`
- `GET /settings/coach/{phase}` — `pre` | `mid` | `end` | `suggestion`
