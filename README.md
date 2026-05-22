# 🧠 Focus Sessions

> An ADHD-friendly productivity web application with Pomodoro timers, ambient soundscapes, intelligent task management, session analytics, gamified rewards, and **group focus rooms** — built to help neurodivergent users stay focused alone or together.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Host & Join Meetings](#-host--join-meetings)
- [Architecture Overview](#-architecture-overview)
- [Application Flow](#-application-flow)
- [Module-Wise Features](#-module-wise-features)
  - [Authentication](#1--authentication-module)
  - [Dashboard](#2--dashboard-module)
  - [Solo Focus Sessions](#3--solo-focus-session-module)
  - [Group Focus Rooms](#4--group-focus-rooms-module)
  - [Task Manager](#5--task-manager-module)
  - [Analytics](#6--analytics-module)
  - [Gamification](#7--gamification-module)
  - [Settings](#8--settings-module)
  - [Audio](#9--audio-module)
- [Component Map](#-component-map)
- [Backend API Reference](#-backend-api-reference)
- [Socket.IO Events](#-socketio-events-real-time)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)
- [Documentation](#-documentation)

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 · TypeScript · Vite | SPA framework & build tooling |
| **Styling** | Tailwind CSS · Framer Motion | Utility-first CSS & animations |
| **State** | Zustand | Lightweight global state management |
| **Forms** | React Hook Form · Zod | Form handling & schema validation |
| **Charts** | Recharts | Analytics visualizations |
| **Real-time** | Socket.IO Client | Live group timers, presence, ready signals |
| **Backend** | FastAPI · Python 3.11+ | REST API + WebSocket server |
| **Real-time** | python-socketio | Group meeting sync & host controls |
| **ORM** | SQLAlchemy 2.0 | Database abstraction |
| **Auth** | JWT (python-jose) · bcrypt | Token-based authentication |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Data persistence |

---

## 🚀 Quick Start

**Prerequisites:** Python 3.11+, Node.js 18+

From Windows Command Prompt:

```cmd
setup.cmd          # Creates venv, installs deps, migrates DB, seeds demo data
start.cmd          # Starts backend + frontend, opens browser
```

**Demo login (seeded):** `demo@focus.local` / `demo1234`

### Manual Setup

```bash
# Backend (REST + Socket.IO on :8000)
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend (separate terminal — proxies /api and /socket.io)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — register, start a solo session, or host a group room.

## 🧩 Host & Join Meetings

Quick steps to try group focus locally:

1. Start backend and frontend (see Quick Start).
2. Register and log in with `demo@focus.local` / `demo1234` or your account.
3. Go to `/create-meeting` (or click Create Room) and create a room.
4. Copy the room code or invite link and open it in another browser/incognito.
5. Join as a participant and tap "I'm ready". Host clicks "Start Focus Session" to begin.

The seed script (`backend/seed.py`) inserts the demo user and example data if the DB is empty.

### PostgreSQL (optional)

Set in `backend/.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/focus_sessions
SECRET_KEY=your-secret-key
```

On startup, `app/core/migrate.py` creates missing tables and adds new SQLite columns automatically.

---

## 🏗 Architecture Overview

```mermaid
graph TB
    subgraph Frontend ["Frontend (React + Vite — :5173)"]
        Pages["Pages Layer"]
        Hooks["Meeting Hooks (Socket.IO)"]
        Store["Zustand Store"]
        API["API Service (Axios)"]
    end

    subgraph Backend ["Backend (FastAPI + Socket.IO — :8000)"]
        Routes["REST Routers"]
        Sockets["Socket.IO Handlers"]
        Services["Business Logic + Timer"]
        Models["SQLAlchemy Models"]
    end

    subgraph Database ["Database"]
        DB["SQLite / PostgreSQL"]
    end

    Pages --> Hooks
    Pages --> Store
    Pages --> API
    Hooks -->|WebSocket| Sockets
    API -->|"/api/*"| Routes
    Routes --> Services
    Sockets --> Services
    Services --> Models
    Models --> DB
```

---

## 🔄 Application Flow

### Solo focus journey

```mermaid
flowchart TD
    A["Landing"] --> B["Login / Register"]
    B --> C["Dashboard"]
    C --> D["Session Setup"]
    D --> E["Focus Mode"]
    E --> F["Break Mode"]
    E --> G["Session Complete"]
    F --> E
    G --> C
```

### Group focus journey

```mermaid
flowchart TD
    H["Dashboard"] --> I["Host Room OR Join Latest"]
    I --> J["Create Meeting / Join Meeting"]
    J --> K["Meeting Room"]
    K --> L["Participants mark I'm ready"]
    L --> M["Host starts shared timer"]
    M --> N["Server timer ticks via Socket.IO"]
    N --> O["Meeting Complete Summary"]
    O --> H

    I2["Invite link with ?code=ABC123"] --> J
```

### Group room phases

| Phase | Status | What users see |
|-------|--------|----------------|
| **Waiting** | `WAITING` | Ready buttons, host picks duration |
| **Focus** | `RUNNING` | Shared countdown timer |
| **Paused** | `PAUSED` | Host paused for everyone |
| **Done** | `COMPLETED` | Summary screen |

---

## 📦 Module-Wise Features

### 1. 🔐 Authentication Module

| Feature | Description |
|---------|-------------|
| Registration | Name, email, password with Zod validation |
| Login | Email + password → JWT stored in `localStorage` |
| Protected routes | Unauthenticated users redirected to login |
| Forgot password | Reset token flow |

**Endpoints:** `POST /api/auth/register`, `login`, `GET /api/auth/me`, `POST /api/auth/logout`

---

### 2. 📊 Dashboard Module

| Feature | Description |
|---------|-------------|
| Stats cards | Today's focus, tasks done, streak, total sessions |
| Charts | Weekly line chart + daily bar distribution |
| Smart recommendation | Suggested session duration |
| AI coach message | Contextual pre-session tip |
| **Host a Focus Room** | Create group session as host |
| **Join Latest Focus Room** | One-click join most recent active room |

---

### 3. 🎯 Solo Focus Session Module

| Feature | Description |
|---------|-------------|
| Session setup | Title, duration, task link, Pomodoro, ambient sound, strict mode |
| 3-2-1 countdown | Gentle start before timer runs |
| Focus timer | Full-screen progress ring |
| Pause / resume | Synced to backend session record |
| Break mode | Optional Pomodoro breaks |
| Session complete | Mood, notes, XP, streak, badges |

**Endpoints:** `POST /api/sessions/start`, `pause`, `resume`, `complete`, `GET /api/sessions/history`

---

### 4. 👥 Group Focus Rooms Module

**Purpose:** Body-doubling style group sessions with a **host-controlled shared timer** and gentle UX for ADHD users.

#### Host flow

1. **Host Room** (`/create-meeting`) — name the room, get a room code
2. **Copy invite** — message includes code + link (`/join-meeting?code=XXXXXX`)
3. Enter **Meeting Room** — see who is online and who is ready
4. Choose duration (15–60 min) → **Start session** for everyone
5. **Pause / Resume** — affects all participants
6. On complete → **Meeting Dashboard** summary

#### Participant flow

1. **Join Latest** (dashboard or sidebar) or open invite link
2. **Join preview** — see room title, host, online/ready counts before entering
3. Tap **I'm ready** when set to focus
4. Wait for host to start — shared timer syncs via server
5. **Minimal mode** (eye icon) — hide sidebar, timer-only view

#### Gentle UX features

| Feature | Description |
|---------|-------------|
| **I'm ready** | Participants signal readiness; host sees `X/Y ready` |
| **Phase bar** | Waiting → Focus → Paused → Done |
| **Invite link** | Shareable URL with room code pre-filled |
| **Reconnect** | Auto-rejoin + timer resync from server state |
| **Live indicator** | Green “Live” when Socket.IO connected |
| **Join latest** | `POST /api/meetings/join-latest` picks newest active room |
| **Server timer** | Authoritative countdown; clients display ticks |

**Key pages**

| Page | Route | Role |
|------|-------|------|
| `CreateMeeting` | `/create-meeting` | Host creates room |
| `JoinMeeting` | `/join-meeting` | Preview + join latest or by code |
| `MeetingRoom` | `/meeting/:roomCode` | Live room + timer |
| `MeetingDashboard` | `/meeting/:roomCode/dashboard` | Post-session summary |

**Hooks & services**

| File | Role |
|------|------|
| `hooks/useMeetingSocket.ts` | Connect, join room, reconnect, sync |
| `hooks/useMeetingState.ts` | Status from socket events |
| `hooks/useMeetingTimer.ts` | `timer_tick` display |
| `hooks/useParticipantPresence.ts` | Online + ready state |
| `services/meetingService.ts` | REST helpers |
| `components/meeting/MeetingPhaseBar.tsx` | Phase stepper UI |
| `utils/meetingUtils.ts` | Invite URLs, timer format, phases |

---

### 5. 📋 Task Manager Module

Full CRUD, filters, due dates, priorities, subtasks, bulk actions. Link tasks to solo focus sessions.

**Endpoints:** `GET/POST/PUT/DELETE /api/tasks`, `POST /api/tasks/bulk`

---

### 6. 📈 Analytics Module

Dashboard stats, weekly/monthly charts, heatmap, session history.

**Endpoints:** `GET /api/analytics/dashboard`, `weekly`, `monthly`, `heatmap`

---

### 7. 🏆 Gamification Module

XP, levels, streaks, achievement badges on session complete.

**Endpoints:** `GET /api/achievements`

---

### 8. ⚙️ Settings Module

Themes, default duration, Pomodoro defaults, sounds, notifications, AI coach toggle.

**Endpoints:** `GET/PUT /api/settings`, `GET /api/settings/coach/{phase}`

---

### 9. 🎵 Audio Module

Ambient sounds (rain, brown/white noise, ocean, forest, café) via Web Audio API during solo focus.

---

## 🗺 Component Map

```mermaid
graph TD
    App["App.tsx"]
    App --> Landing & Auth["Landing · Login · Register"]
    App --> Protected["ProtectedRoute"]
    Protected --> Layout["Layout (Sidebar)"]
    Protected --> Solo["FocusMode · BreakMode · SessionComplete"]
    Protected --> Group["MeetingRoom (fullscreen layout optional)"]

    Layout --> Dashboard
    Layout --> SessionSetup
    Layout --> CreateMeeting
    Layout --> JoinMeeting
    Layout --> MeetingDashboard
    Layout --> TaskManager
    Layout --> Analytics
    Layout --> Achievements
    Layout --> Settings
```

**Sidebar navigation:** Home · Focus · **Host Room** · **Join Latest** · Tasks · Stats · Rewards · Settings

---

## 🔌 Backend API Reference

### Meetings (group focus) — prefix `/api/meetings`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/create?title=` | Create room; host auto-joins as participant and receives preview data |
| `GET` | `/latest/available` | Preview newest joinable room (if any) |
| `POST` | `/join-latest` | Join the newest available active room |
| `POST` | `/join/{room_code}` | Join a specific room by room code |
| `GET` | `/{room_code}` | Room preview metadata (title, host, counts, status) |
| `GET` | `/{room_code}/state` | Full sync state (timer, participants, ready counts) |
| `GET` | `/{room_code}/summary` | Post-session summary (focused minutes, host, counts) |
| `GET` | `/{room_code}/participants` | Participant list with online/ready flags |
| `POST` | `/{room_code}/start?duration_minutes=` | Host-only: start the meeting; returns `started_at` and `remaining_seconds` |

All meeting routes require `Authorization: Bearer <token>`.

### Other APIs

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login, me, logout |
| `/api/tasks` | Task CRUD + bulk |
| `/api/sessions` | Solo focus lifecycle |
| `/api/analytics` | Stats and charts |
| `/api/achievements` | Badges |
| `/api/settings` | User preferences + coach |

Interactive docs: http://localhost:8000/docs

---

## ⚡ Socket.IO Events (real-time)

Connect to the same origin as the API (Vite proxies `/socket.io` → `:8000` in dev).

**Auth:** pass JWT in connection `auth: { token: "<focus_token>" }`

| Event (client → server) | Payload | Description |
|-------------------------|---------|-------------|
| `join_room` | `{ room_code }` | Enter Socket.IO room; returns `sync` in ack |
| `leave_room` | `{ room_code }` | Leave room |
| `request_sync` | `{ room_code }` | Request full state (reconnect) |
| `mark_ready` | `{ room_code, ready: bool }` | Toggle ready status |
| `start_meeting` | `{ room_code, duration_minutes }` | Host only — start timer |
| `pause_meeting` | `{ room_code }` | Host only |
| `resume_meeting` | `{ room_code }` | Host only |

| Event (server → client) | Description |
|-------------------------|-------------|
| `meeting_sync` | Full room state |
| `meeting_started` | Session began |
| `timer_tick` | `{ remaining_seconds, status }` every second |
| `meeting_paused` / `meeting_resumed` | Host controls |
| `meeting_completed` | Timer hit zero |
| `participant_online` / `participant_offline` | Presence |
| `ready_update` | Someone toggled ready |

---

## 🗄 Database Schema

Core tables plus **group focus**:

```mermaid
erDiagram
    users ||--o{ focus_sessions : starts
    users ||--o{ meetings : hosts
    users ||--o{ meeting_participants : joins
    meetings ||--o{ meeting_participants : has
    meetings ||--o{ user_presence : tracks
    users ||--o{ tasks : creates
    users ||--|| user_settings : configures
    users ||--|| streaks : maintains

    meetings {
        int id PK
        string title
        string room_code UK
        int host_id FK
        string status
        datetime meeting_start_time
        int meeting_duration
        int remaining_time
        datetime created_at
    }

    meeting_participants {
        int id PK
        int meeting_id FK
        int user_id FK
        boolean is_ready
        datetime joined_at
    }

    user_presence {
        int id PK
        int meeting_id FK
        int user_id FK
        boolean connected
        datetime last_seen
        datetime joined_at
        datetime left_at
    }
```

Solo focus tables (`focus_sessions`, `tasks`, `streaks`, `achievements`, etc.) are unchanged. See `backend/app/models/` for full definitions.

---

## 📂 Project Structure

```
focus-sessions/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   ├── sessions.py          # Solo focus
│   │   │   ├── meetings.py          # Group rooms (REST)
│   │   │   ├── sockets.py           # Group rooms (Socket.IO)
│   │   │   ├── analytics.py
│   │   │   ├── achievements.py
│   │   │   └── settings.py
│   │   ├── models/
│   │   │   ├── meeting.py           # Meeting, MeetingParticipant
│   │   │   ├── presence.py          # UserPresence
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── meeting_sync.py      # Sync payload builder
│   │   │   ├── timer_service.py     # Server-side group timer
│   │   │   └── ...
│   │   ├── core/
│   │   │   ├── migrate.py           # Auto SQLite migrations
│   │   │   └── ...
│   │   └── main.py                  # FastAPI + Socket.IO ASGI
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CreateMeeting.jsx
│   │   │   ├── JoinMeeting.jsx
│   │   │   ├── MeetingRoom.jsx
│   │   │   ├── MeetingDashboard.jsx
│   │   │   └── ...                  # Solo + core pages
│   │   ├── components/meeting/
│   │   │   └── MeetingPhaseBar.tsx
│   │   ├── hooks/
│   │   │   ├── useMeetingSocket.ts
│   │   │   ├── useMeetingState.ts
│   │   │   ├── useMeetingTimer.ts
│   │   │   └── useParticipantPresence.ts
│   │   ├── services/
│   │   │   ├── api.ts               # meetingsApi included
│   │   │   └── meetingService.ts
│   │   └── utils/meetingUtils.ts
│   └── vite.config.ts               # Proxies /api + /socket.io
│
├── setup.cmd
├── start.cmd
└── README.md
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `setup.cmd` | Venv, deps, DB migrate, seed |
| `start.cmd` | Backend + frontend + open browser |
| `test-all.cmd` | Run tests and build |
| `build.cmd` | Production build |
| `npm run dev` | Frontend dev server |
| `uvicorn app.main:app --reload` | Backend with hot reload |

---

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Installation](docs/INSTALLATION.md)
- [API Reference](docs/API.md)
- [User Manual](docs/USER_MANUAL.md)

---

## 🎨 Design System

- **Themes:** Dark (default), Light (+ settings-driven variants)
- **Typography:** DM Sans
- **Components:** `btn-primary`, `btn-secondary`, `card`, `card-elevated`, `input-field`
- **Group UX:** Phase bar, ready states, minimal mode, reconnect banner — kept calm and low-noise for ADHD users

---

## 🧪 Testing group focus locally

1. Start backend + frontend.
2. Browser A: register/login → **Host Room** → create → enter room.
3. Browser B (incognito): register/login → **Join Latest** or paste invite link.
4. B: tap **I'm ready**. A: see ready count → **Start session**.
5. Confirm timer counts down on both browsers.
6. Optional: toggle **minimal mode** (eye icon) on either client.

---

<p align="center">
  Built with 💜 for the ADHD community — solo focus and quiet accountability together.
</p>
