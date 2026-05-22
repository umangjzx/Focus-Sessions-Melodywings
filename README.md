# 🧠 Focus Sessions

> An ADHD-friendly productivity web application with Pomodoro timers, ambient soundscapes, task management, analytics, gamification, and **group focus rooms** with optional video — built for solo focus and quiet accountability together.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Host & Join Meetings](#-host--join-meetings)
- [System Architecture](#-system-architecture)
- [Application Flows](#-application-flows)
- [Module-Wise Features](#-module-wise-features)
- [Backend API Reference](#-backend-api-reference)
- [Socket.IO Events](#-socketio-events-real-time)
- [Database Tables](#-database-tables)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)
- [Documentation](#-documentation)

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 · TypeScript · Vite | SPA on `:5173` |
| **Styling** | Tailwind CSS · Framer Motion | UI & motion |
| **State** | Zustand | Auth + app state |
| **Forms** | React Hook Form · Zod | Validation |
| **Charts** | Recharts | Analytics |
| **Real-time client** | socket.io-client | Group timer, presence, ready |
| **Optional video** | Jitsi (`meet.jit.si`) | Embedded WebRTC (camera/mic off by default) |
| **Backend** | FastAPI · python-socketio | REST + WebSocket on `:8000` |
| **ORM** | SQLAlchemy 2.0 | Models & queries |
| **Auth** | JWT · bcrypt | Bearer tokens |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Persistence |

---

## 🚀 Quick Start

**Prerequisites:** Python 3.11+, Node.js 18+

```cmd
setup.cmd          # venv, deps, migrate DB, seed demo data
start.cmd          # backend + frontend, open browser
```

**Demo login:** `demo@focus.local` / `demo1234`

### Manual setup

```bash
# Backend — REST + Socket.IO
cd backend && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend — proxies /api and /socket.io to :8000
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

### PostgreSQL (optional)

```env
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/focus_sessions
SECRET_KEY=your-secret-key
```

Startup runs `app/core/migrate.py` to create tables and patch SQLite columns.

---

## 🧩 Host & Join Meetings

1. Start backend and frontend.
2. Log in (`demo@focus.local` / `demo1234` or register).
3. **Host:** `/create-meeting` → copy code or invite link.
4. **Join:** `/join-meeting`, **Join Latest**, or `?code=ABC123` in the URL.
5. Participants tap **I'm ready** → host **Start session** → shared timer runs.
6. Optional: **Open video** (Jitsi, muted by default).

---

## 🏗 System Architecture

Single end-to-end view: clients, frontend, API gateway, backend services, real-time layer, optional video, and database.

```mermaid
flowchart TB
    subgraph Clients["Clients (Browser)"]
        U1["User A — Host"]
        U2["User B — Participant"]
    end

    subgraph FE["Frontend — React + Vite :5173"]
        direction TB
        Router["App.tsx · React Router"]
        subgraph Pages["Pages"]
            PUB["Landing · Login · Register"]
            DASH["Dashboard"]
            SOLO_P["SessionSetup · FocusMode · BreakMode · SessionComplete"]
            GRP_P["CreateMeeting · JoinMeeting · MeetingRoom · MeetingDashboard"]
            TASK["TaskManager"]
            ANA["Analytics · Achievements · Settings"]
        end
        subgraph FEState["State & Data"]
            ZAuth["authStore — JWT in localStorage"]
            ZApp["useAppStore — settings, active solo session"]
            Axios["api.ts — Axios + Bearer interceptor"]
        end
        subgraph FEGroup["Group focus (real-time)"]
            SockHook["useMeetingSocket — connect, join_room, reconnect"]
            StateHook["useMeetingState · useMeetingTimer"]
            PresHook["useParticipantPresence — online + ready"]
            MeetSvc["meetingService.ts"]
            PhaseUI["MeetingPhaseBar · MeetingVideoCall"]
        end
        subgraph FESolo["Solo focus"]
            TimerHook["useTimer — client countdown"]
            Ambient["AmbientSoundPlayer — Web Audio"]
        end
        Proxy["Vite dev proxy → :8000"]
    end

    subgraph EXT["External (optional)"]
        Jitsi["Jitsi meet.jit.si — WebRTC video/audio"]
    end

    subgraph BE["Backend — FastAPI ASGI :8000"]
        direction TB
        ASGI["socketio.ASGIApp wraps FastAPI app"]
        subgraph REST["REST /api/*"]
            RAuth["auth — register, login, me"]
            RTasks["tasks — CRUD, bulk"]
            RSess["sessions — solo start/pause/complete"]
            RMeet["meetings — create, join, join-latest, state, summary"]
            RAnal["analytics — dashboard, weekly, heatmap"]
            RAch["achievements"]
            RSet["settings + AI coach"]
        end
        subgraph WS["Socket.IO handlers — sockets.py"]
            WJoin["join_room / leave_room / request_sync"]
            WReady["mark_ready"]
            WHost["start_meeting · pause_meeting · resume_meeting"]
            WEmit["emit: timer_tick, meeting_started, participant_online, ready_update"]
        end
        subgraph SVC["Services"]
            TimerSvc["timer_service — server countdown task"]
            MeetSync["meeting_sync — full room payload"]
            Prod["productivity · coach · achievements"]
        end
        subgraph Core["Core"]
            JWT["security — JWT decode"]
            DBLayer["SQLAlchemy SessionLocal"]
            Migr["migrate.py — schema patches"]
        end
        Deps["deps.py — get_current_user"]
    end

    subgraph DB["Database — SQLite / PostgreSQL"]
        TUsers["users"]
        TTasks["tasks · subtasks"]
        TSess["focus_sessions · session_notes"]
        TMeet["meetings · meeting_participants"]
        TPres["user_presence"]
        TGam["streaks · achievements · user_settings"]
    end

    U1 --> Router
    U2 --> Router
    Router --> PUB & DASH & SOLO_P & GRP_P & TASK & ANA
    GRP_P --> SockHook & MeetSvc & PhaseUI
    SOLO_P --> TimerHook & Ambient
    DASH & SOLO_P & GRP_P & TASK --> Axios
    GRP_P --> MeetSvc
    MeetSvc --> Axios
    Pages --> ZAuth & ZApp
    Axios --> Proxy
    SockHook --> Proxy
    PhaseUI -->|"optional Open video"| Jitsi

    Proxy -->|"/api/* HTTP"| ASGI
    Proxy -->|"/socket.io WebSocket"| ASGI

    ASGI --> REST
    ASGI --> WS
    REST --> Deps
    Deps --> JWT
    REST --> SVC
    REST --> DBLayer
    WS --> JWT
    WS --> TimerSvc
    WS --> MeetSync
    TimerSvc --> WEmit
    MeetSync --> DBLayer
    SVC --> DBLayer
    DBLayer --> TUsers & TTasks & TSess & TMeet & TPres & TGam
    Migr --> DB

    WJoin -->|"enter_room meeting_{id}"| WEmit
    WHost --> TimerSvc
    TimerSvc -->|"every 1s"| WEmit
```

### Architecture notes

| Path | Protocol | Responsibility |
|------|----------|----------------|
| Solo focus timer | REST + client `useTimer` | Session rows in `focus_sessions`; XP/streak on complete |
| Group focus timer | Socket.IO + `timer_service` | Server owns `remaining_time`; clients render `timer_tick` |
| Room membership | REST `join` + Socket `join_room` | `meeting_participants` + Socket.IO room |
| Presence / ready | Socket.IO | `user_presence`, `is_ready`, broadcast events |
| Video | Jitsi iframe (client only) | Same room name per `room_code`; not stored in DB |
| Auth | JWT | All `/api/*` and Socket connect `auth.token` |

---

## 🔄 Application Flows

### Solo focus

`Landing` → `Login/Register` → `Dashboard` → `Session Setup` → `Focus Mode` → (`Break Mode` if Pomodoro) → `Session Complete` → mood/XP → `Dashboard`

### Group focus

`Dashboard` → **Host Room** or **Join Latest** / invite link → `Meeting Room` → **I'm ready** → host **Start** → shared timer (Socket.IO) → optional **Jitsi video** → `Meeting Dashboard` summary

### Group phases

| Phase | Status | UI |
|-------|--------|-----|
| Waiting | `WAITING` | Ready buttons, host picks duration |
| Focus | `RUNNING` | Shared countdown |
| Paused | `PAUSED` | Host paused all |
| Done | `COMPLETED` | Summary page |

---

## 📦 Module-Wise Features

### 1. Authentication

Register, login, JWT in `localStorage`, protected routes, forgot-password stub.  
**API:** `/api/auth/*`

### 2. Dashboard

Stats, weekly/daily charts, coach tip, **Host Room**, **Join Latest**.

### 3. Solo focus sessions

Setup (duration, task, Pomodoro, ambient, strict mode), 3-2-1 countdown, pause/resume, break, complete with mood/XP/badges.  
**API:** `/api/sessions/*`

### 4. Group focus rooms

Host-controlled timer, ready signals, invite links, reconnect sync, phase bar, minimal mode, optional Jitsi video.  
**Pages:** `CreateMeeting`, `JoinMeeting`, `MeetingRoom`, `MeetingDashboard`  
**API:** `/api/meetings/*` · **Socket:** see below

### 5. Task manager

CRUD, filters, subtasks, bulk actions, link to solo sessions.  
**API:** `/api/tasks/*`

### 6. Analytics

Dashboard stats, weekly/monthly, heatmap.  
**API:** `/api/analytics/*`

### 7. Gamification

XP, levels, streaks, badges.  
**API:** `/api/achievements`

### 8. Settings

Theme, defaults, sounds, coach toggle.  
**API:** `/api/settings/*`

### 9. Audio

Ambient sounds via Web Audio during solo focus.

### Frontend routes (reference)

| Route | Page |
|-------|------|
| `/welcome` | Landing |
| `/login`, `/register` | Auth |
| `/` | Dashboard |
| `/setup`, `/focus`, `/break`, `/complete` | Solo pipeline |
| `/create-meeting`, `/join-meeting` | Group entry |
| `/meeting/:roomCode` | Live room |
| `/meeting/:roomCode/dashboard` | Group summary |
| `/tasks`, `/analytics`, `/achievements`, `/settings` | Productivity |

---

## 🔌 Backend API Reference

### Meetings — `/api/meetings`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/create?title=` | Create room; host joins |
| `GET` | `/latest/available` | Newest joinable room |
| `POST` | `/join-latest` | Join newest active room |
| `POST` | `/join/{room_code}` | Join by code |
| `GET` | `/{room_code}` | Preview metadata |
| `GET` | `/{room_code}/state` | Full sync state |
| `GET` | `/{room_code}/summary` | Post-session summary |
| `GET` | `/{room_code}/participants` | List with online/ready |
| `POST` | `/{room_code}/start?duration_minutes=` | REST start (host) |

### Other prefixes

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Auth |
| `/api/tasks` | Tasks |
| `/api/sessions` | Solo focus |
| `/api/analytics` | Stats |
| `/api/achievements` | Badges |
| `/api/settings` | Preferences + coach |

Docs: http://localhost:8000/docs

---

## ⚡ Socket.IO Events (real-time)

**Connect:** `auth: { token: "<focus_token>" }` · Vite proxies `/socket.io` → `:8000`

**Client → server**

| Event | Payload |
|-------|---------|
| `join_room` | `{ room_code }` → ack includes `sync` |
| `leave_room` | `{ room_code }` |
| `request_sync` | `{ room_code }` |
| `mark_ready` | `{ room_code, ready }` |
| `start_meeting` | `{ room_code, duration_minutes }` |
| `pause_meeting` / `resume_meeting` | `{ room_code }` |

**Server → client**

| Event | Purpose |
|-------|---------|
| `meeting_sync` | Full state (reconnect) |
| `meeting_started` | Focus began |
| `timer_tick` | `remaining_seconds` each second |
| `meeting_paused` / `meeting_resumed` | Host control |
| `meeting_completed` | Timer ended |
| `participant_online` / `participant_offline` | Presence |
| `ready_update` | Ready count changed |

---

## 🗄 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts |
| `tasks`, `subtasks` | Task manager |
| `focus_sessions`, `session_notes` | Solo focus history |
| `meetings` | Group rooms (`room_code`, `status`, `remaining_time`, …) |
| `meeting_participants` | Who joined; `is_ready` |
| `user_presence` | Socket online state per meeting |
| `streaks`, `achievements` | Gamification |
| `user_settings` | Preferences |

Models live in `backend/app/models/`.

---

## 📂 Project Structure

```
focus-sessions/
├── backend/app/
│   ├── api/          auth, tasks, sessions, meetings, sockets, analytics, achievements, settings
│   ├── models/       user, task, session, meeting, presence, streak, achievement, settings
│   ├── services/     timer_service, meeting_sync, productivity, coach, achievements
│   ├── core/         config, database, security, migrate
│   └── main.py       FastAPI + Socket.IO ASGI
├── frontend/src/
│   ├── pages/        Dashboard, solo focus, CreateMeeting, JoinMeeting, MeetingRoom, …
│   ├── components/   layout, focus, meeting/
│   ├── hooks/        useTimer, useMeetingSocket, useMeetingState, …
│   ├── services/     api.ts, meetingService.ts
│   └── utils/        meetingUtils.ts, helpers.ts
├── setup.cmd · start.cmd
└── README.md
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `setup.cmd` | Setup + seed |
| `start.cmd` | Run app |
| `npm run dev` | Frontend |
| `uvicorn app.main:app --reload` | Backend |

---

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Installation](docs/INSTALLATION.md)
- [API Reference](docs/API.md)
- [User Manual](docs/USER_MANUAL.md)

---

## 🎨 Design principles

- ADHD-friendly: small starts, optional video, muted defaults, minimal mode, calm copy
- **Jitsi (optional):** `VITE_JITSI_DOMAIN=meet.yourdomain.com` in `frontend/.env`

---

<p align="center">
  Built with 💜 for the ADHD community
</p>
