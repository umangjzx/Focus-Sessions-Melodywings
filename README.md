# 🧠 Focus Sessions

> An ADHD-friendly productivity web application with Pomodoro timers, ambient soundscapes, task management, analytics, gamification, and **group focus rooms** with optional video — built for solo focus and quiet accountability together.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [AI coach (Ollama)](#ai-coach-optional--ollama)
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
| **AI coach (optional)** | [Ollama](https://ollama.com/) · `qwen2.5-coder:7b` | Local LLM; personalized from your app data |
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

### AI coach (optional — Ollama)

The coach reads **your real Focus Sessions data** (streak, tasks, sessions, settings, active session) and answers via a **chat button** (bottom-right on every logged-in page).

```bash
ollama pull qwen2.5-coder:7b
ollama run qwen2.5-coder:7b
```

```env
# backend/.env
OLLAMA_ENABLED=true
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_TIMEOUT_SECONDS=60
```

Enable **AI focus coach** in Settings. Check: `GET /api/settings/coach/status` → `ollama_ready: true`.  
If Ollama is off, the app uses built-in fallback messages (still personalized where possible).

---

## Host and Join Meetings

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
        subgraph FECoach["AI coach"]
            CoachUI["CoachChat — floating chat button"]
            CoachCtx["coachClient.ts — page + session hints"]
        end
        Proxy["Vite dev proxy → :8000"]
    end

    subgraph EXT["External (optional)"]
        Jitsi["Jitsi meet.jit.si — WebRTC video/audio"]
        OllamaExt["Ollama :11434 — local LLM"]
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
            CoachSvc["coach.py — Ollama chat"]
            CoachCtxSvc["coach_context.py — user snapshot from DB"]
            Prod["productivity · achievements"]
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
    DASH & SOLO_P & GRP_P & TASK & ANA --> Axios
    Router --> CoachUI
    CoachUI --> CoachCtx
    CoachUI --> Axios
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
    REST --> CoachSvc
    CoachSvc --> CoachCtxSvc
    CoachCtxSvc --> DBLayer
    CoachSvc -->|"HTTP /api/chat"| OllamaExt
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
| AI coach | REST → Ollama | `coach_context` builds profile from DB; chat + phase tips |
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

Stats, weekly/daily charts, personalized coach tip, **Host Room**, **Join Latest**.

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

### 8. Settings & AI coach

Theme, defaults, sounds, **AI focus coach** toggle.

**UI**

- **Floating chat button** (bottom-right) on all authenticated pages — open to ask anything about focus, tasks, or your next session.
- **Inline tips** on Dashboard (`pre`), Session Setup (`pre`), Focus Mode (`mid`), Session Complete (`end`).

**Personalization**

Before each reply, `coach_context.py` loads a snapshot from your account:

| Source | Used for |
|--------|----------|
| Streaks / XP | Level, current & longest streak |
| `focus_sessions` | Today & week minutes, active session, last session, recent history |
| `tasks` | Open tasks (title, priority, estimate), overdue count |
| `user_settings` | Default duration, Pomodoro, auto-breaks, ambient sound |
| Analytics logic | Recommended next session length |
| `achievements` | Recent badges |
| Frontend hints | Current page, planned title/task/goal, in-focus flag |

The LLM system prompt includes this block and is told to **use real numbers only** (no invented stats).

**API**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings/coach/status` | `ollama_ready`, model, base URL |
| `GET` | `/api/settings/coach/{phase}` | One-line tip: `pre` \| `mid` \| `end` \| `suggestion` |
| `POST` | `/api/settings/coach/chat` | Multi-turn chat; body: `{ messages, client? }` |

Optional query/body `client` fields: `page`, `planned_minutes`, `session_title`, `task_title`, `goal`, `in_focus_session`.

Response shape: `{ "message": "...", "source": "ollama" | "fallback" | "disabled" }`.

**Ollama**

Default model: `qwen2.5-coder:7b`. See [Quick Start → AI coach](#ai-coach-optional--ollama). First reply after idle can take ~30–60s while the model loads.

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

**Global UI:** `CoachChat` (protected routes) — floating coach button, not a separate route.

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
| `/api/settings` | Preferences + AI coach |

### AI coach — `/api/settings/coach`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Ollama reachable and model pulled |
| `GET` | `/{phase}` | Phase tip (`pre`, `mid`, `end`, `suggestion`); optional query: `page`, `planned_minutes`, `session_title`, `task_title`, `goal`, `in_focus_session` |
| `POST` | `/chat` | Body: `{ "messages": [{ "role", "content" }], "client": { ... } }` |

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
│   ├── services/     timer_service, meeting_sync, coach, coach_context, productivity, achievements
│   ├── schemas/      coach (chat request/response), settings, …
│   ├── core/         config, database, security, migrate
│   └── main.py       FastAPI + Socket.IO ASGI
├── frontend/src/
│   ├── pages/        Dashboard, solo focus, CreateMeeting, JoinMeeting, MeetingRoom, …
│   ├── components/   layout, focus, meeting, coach/CoachChat
│   ├── hooks/        useTimer, useMeetingSocket, useMeetingState, …
│   ├── services/     api.ts, meetingService.ts
│   └── utils/        meetingUtils.ts, coachClient.ts, helpers.ts
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
- **AI coach:** local-only via Ollama; replies grounded in your tasks, streak, and session history
- **Jitsi (optional):** `VITE_JITSI_DOMAIN=meet.yourdomain.com` in `frontend/.env`

---

<p align="center">
  Built with 💜 for the ADHD community
</p>
