# 🧠 Focus Sessions

> An ADHD-friendly productivity web application with Pomodoro timers, ambient soundscapes, intelligent task management, session analytics, and gamified rewards — built to help neurodivergent users stay focused and accomplish more.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture Overview](#-architecture-overview)
- [Application Flow](#-application-flow)
- [Module-Wise Features](#-module-wise-features)
  - [Authentication Module](#1--authentication-module)
  - [Dashboard Module](#2--dashboard-module)
  - [Session Module](#3--session-module)
  - [Task Manager Module](#4--task-manager-module)
  - [Analytics Module](#5--analytics-module)
  - [Gamification Module](#6--gamification-module)
  - [Settings Module](#7--settings-module)
  - [Audio Module](#8--audio-module)
- [Component Map](#-component-map)
- [Backend API Reference](#-backend-api-reference)
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
| **Backend** | FastAPI · Python 3.11+ | REST API server |
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
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — register an account and start a focus session.

### PostgreSQL (optional)

Set in `backend/.env`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/focus_sessions
SECRET_KEY=your-secret-key
```

---

## 🏗 Architecture Overview

```mermaid
graph TB
    subgraph Frontend ["Frontend (React + Vite — :5173)"]
        Pages["Pages Layer"]
        Components["Components Layer"]
        Store["Zustand Store"]
        API["API Service (Axios)"]
    end

    subgraph Backend ["Backend (FastAPI — :8000)"]
        Routes["API Router"]
        Services["Business Logic"]
        Models["SQLAlchemy Models"]
    end

    subgraph Database ["Database"]
        SQLite["SQLite / PostgreSQL"]
    end

    Pages --> Components
    Pages --> Store
    Pages --> API
    Store --> API
    API -->|"/api/*"| Routes
    Routes --> Services
    Services --> Models
    Models --> SQLite
```

---

## 🔄 Application Flow

### User Journey Flow

```mermaid
flowchart TD
    A["🌐 Landing Page"] -->|Register/Login| B["🔐 Authentication"]
    B -->|JWT Token| C["📊 Dashboard"]
    
    C -->|Start Session| D["⚙️ Session Setup"]
    C -->|Manage Tasks| H["📋 Task Manager"]
    C -->|View Stats| I["📈 Analytics"]
    C -->|View Rewards| J["🏆 Achievements"]
    C -->|Configure| K["⚙️ Settings"]
    
    D -->|3-2-1 Countdown| E["🎯 Focus Mode"]
    E -->|Timer Complete| F["☕ Break Mode"]
    E -->|Quit/Complete| G["✅ Session Complete"]
    F -->|Break Over| E
    F -->|End Session| G
    
    G -->|Rate & Review| C
    
    H -->|Link Task to Session| D
```

### Focus Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Setup : User configures session
    Setup --> Countdown : Click "Begin Focus"
    Countdown --> Focusing : 3-2-1 countdown ends
    Focusing --> Paused : Pause button
    Paused --> Focusing : Resume button
    Focusing --> Break : Pomodoro interval ends
    Break --> Focusing : Break timer ends
    Focusing --> Complete : Timer reaches zero
    Focusing --> Complete : User ends early
    Complete --> [*] : Rate mood & save
```

### Task Status Workflow

```mermaid
stateDiagram-v2
    [*] --> Todo : Task created
    Todo --> InProgress : Click status icon
    InProgress --> Completed : Click status icon
    Completed --> Todo : Click status icon (cycle)
```

---

## 📦 Module-Wise Features

### 1. 🔐 Authentication Module

**Purpose:** Secure user registration, login, and session management.

| Feature | Description |
|---------|-------------|
| Registration | Name, email, password with Zod validation |
| Login | Email + password, returns JWT token |
| Auto-login | Persisted JWT token in localStorage |
| Protected Routes | Redirect unauthenticated users to login |
| Forgot Password | Email-based password reset flow |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `Login` | `pages/Login.tsx` | Login form with validation |
| `Register` | `pages/Register.tsx` | Registration form with confirm password |
| `Landing` | `pages/Landing.tsx` | Welcome/onboarding page |
| `ProtectedRoute` | `components/ProtectedRoute.tsx` | Auth guard wrapper |
| `authStore` | `store/authStore.ts` | Auth state (user, login, logout, loadUser) |

**Backend Endpoints:**
- `POST /api/auth/register` — Create account, return JWT
- `POST /api/auth/login` — Authenticate, return JWT
- `GET /api/auth/me` — Get current user profile
- `POST /api/auth/logout` — Invalidate token
- `POST /api/auth/forgot-password` — Send reset email

---

### 2. 📊 Dashboard Module

**Purpose:** Central hub showing daily progress, weekly trends, smart recommendations, and quick actions.

| Feature | Description |
|---------|-------------|
| Stats Cards | Today's focus time, tasks completed, streak days, total sessions |
| Weekly Chart | Line chart showing daily focus minutes (7 days) |
| Daily Distribution | Bar chart with per-day breakdown |
| Smart Recommendation | AI-suggested session duration based on user patterns |
| Coach Message | Motivational/contextual message from AI coach |
| Quick Start | One-click navigation to session setup |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `Dashboard` | `pages/Dashboard.tsx` | Main dashboard page with charts & stats |
| `useAppStore` | `store/useAppStore.ts` | Dashboard data, settings, active session state |

---

### 3. 🎯 Session Module

**Purpose:** End-to-end focus session lifecycle — setup, focus timer, breaks, and completion review.

| Feature | Description |
|---------|-------------|
| Session Setup | Title, duration picker, task linking, Pomodoro presets, ambient sound, strict mode |
| Duration Presets | 5, 15, 25, 45, 60, 90, 120 minute quick-select buttons |
| Pomodoro Presets | 25/5, 50/10, or custom work/break intervals |
| 3-2-1 Countdown | Animated countdown overlay before session starts |
| Focus Timer | Full-screen circular progress ring with remaining time |
| Pause/Resume | Pause tracking with pause counter |
| Strict Mode | Requires typing a phrase to quit early (impulse control) |
| Auto-Start Breaks | Automatic break period after work intervals |
| Break Mode | Guided break with timer, stretching/hydration reminders |
| Session Complete | Mood rating, notes, XP earned, badges unlocked |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `SessionSetup` | `pages/SessionSetup.tsx` | Session configuration form |
| `FocusMode` | `pages/FocusMode.tsx` | Active focus timer with progress ring |
| `BreakMode` | `pages/BreakMode.tsx` | Break timer between Pomodoro intervals |
| `SessionComplete` | `pages/SessionComplete.tsx` | Post-session review & mood rating |
| `CountdownOverlay` | `components/focus/CountdownOverlay.tsx` | 3-2-1 animated countdown |
| `ProgressRing` | `components/focus/ProgressRing.tsx` | SVG circular progress indicator |
| `useTimer` | `hooks/useTimer.ts` | Timer logic (start, pause, resume, tick) |

---

### 4. 📋 Task Manager Module

**Purpose:** Full-featured task management with search, filters, due dates, inline editing, bulk operations, and subtask tracking.

| Feature | Description |
|---------|-------------|
| Task CRUD | Create, read, update, delete tasks |
| Stats Header | Total tasks, completed (%), in-progress, estimated time |
| Search | Real-time search by task title |
| Filter by Status | All / To Do / In Progress / Completed |
| Filter by Priority | All / High / Medium / Low |
| Sort | Newest, Oldest, Priority, Due Date |
| Due Dates | Optional due date with color-coded urgency (overdue=red, today=amber, upcoming=blue) |
| Priority Levels | High (red), Medium (amber), Low (blue) with color-coded badges |
| Status Workflow | Click status icon to cycle: Todo → In Progress → Completed → Todo |
| Inline Editing | Click task title to rename in-place |
| Expandable Details | Chevron to reveal description, notes, tags, timestamps |
| Subtasks | Create tasks as children of parent tasks |
| Subtask Progress | Animated progress bar showing subtask completion |
| Bulk Actions | Checkbox selection + batch complete/delete |
| Empty State | Illustrated placeholder when no tasks match |
| Estimated Time | Set and display estimated minutes per task |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `TaskManager` | `pages/TaskManager.tsx` | Full task management page |

**Backend Endpoints:**
- `GET /api/tasks?status=&priority=&search=` — List tasks with optional filters
- `POST /api/tasks` — Create task or subtask
- `PUT /api/tasks/{id}` — Update task fields
- `DELETE /api/tasks/{id}` — Delete task (cascades subtasks)
- `POST /api/tasks/bulk` — Bulk complete/delete operations

---

### 5. 📈 Analytics Module

**Purpose:** Visualize focus patterns, session history, and productivity trends.

| Feature | Description |
|---------|-------------|
| Weekly Focus | Minutes per day over the past 7 days |
| Monthly Trends | Sessions and minutes per month |
| Heatmap | Activity heatmap showing focus patterns |
| Session History | Chronological list of all completed sessions |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `Analytics` | `pages/Analytics.tsx` | Charts and session history |

**Backend Endpoints:**
- `GET /api/analytics/dashboard` — Aggregated stats (focus mins, streaks, XP, level)
- `GET /api/analytics/weekly` — 7-day focus breakdown
- `GET /api/analytics/monthly` — Monthly aggregates
- `GET /api/analytics/heatmap` — Activity heatmap data

---

### 6. 🏆 Gamification Module

**Purpose:** XP, leveling, streaks, and achievement badges to keep users motivated.

| Feature | Description |
|---------|-------------|
| XP System | Earn XP for completing sessions (based on duration & mood) |
| Leveling | Level up as XP accumulates |
| Streaks | Track consecutive days with at least one session |
| Achievements | Unlock badges for milestones (e.g., "First Session", "7-Day Streak") |
| Badge Display | Visual badge gallery with earned dates |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `Achievements` | `pages/Achievements.tsx` | Badge gallery |
| Sidebar XP Card | `components/layout/Layout.tsx` | Level, XP, streak display in sidebar |

**Backend Endpoints:**
- `GET /api/achievements` — List earned badges

---

### 7. ⚙️ Settings Module

**Purpose:** Personalize the app experience — themes, sounds, Pomodoro defaults, and AI coach.

| Feature | Description |
|---------|-------------|
| Theme | Dark, Light, Calm Blue, Forest Green |
| Default Duration | Default session length |
| Pomodoro Defaults | Default work/break intervals |
| Sound Preferences | Preferred ambient sound and volume |
| Notifications | Enable/disable notifications |
| Auto-Start Breaks | Default break behavior |
| AI Coach | Enable/disable motivational coach messages |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `Settings` | `pages/Settings.tsx` | Settings form |

**Backend Endpoints:**
- `GET /api/settings` — Get user settings
- `PUT /api/settings` — Update settings
- `GET /api/settings/coach/{phase}` — AI coach message for session phase

---

### 8. 🎵 Audio Module

**Purpose:** Ambient soundscapes to enhance focus using Web Audio API.

| Feature | Description |
|---------|-------------|
| Ambient Sounds | Rain, Brown Noise, White Noise, Ocean, Forest, Café |
| Volume Control | Adjustable volume slider |
| Music Player | Background music during focus sessions |
| Sound Selection | Choose ambient sound during session setup |

**Components:**

| Component | File | Role |
|-----------|------|------|
| `AmbientSoundPlayer` | `components/AmbientSoundPlayer.tsx` | Web Audio API player with oscillator |
| `MusicPlayer` | `components/MusicPlayer.tsx` | Background music controls |
| Sounds Data | `data/ambientSounds.ts` | Sound definitions and metadata |

---

## 🗺 Component Map

```mermaid
graph TD
    App["App.tsx (Router)"]
    
    App --> Landing["Landing"]
    App --> Login["Login"]
    App --> Register["Register"]
    App --> Protected["ProtectedRoute"]
    
    Protected --> Layout["Layout (Sidebar + Outlet)"]
    Protected --> FocusMode["FocusMode"]
    Protected --> BreakMode["BreakMode"]
    Protected --> SessionComplete["SessionComplete"]
    
    Layout --> Dashboard["Dashboard"]
    Layout --> SessionSetup["SessionSetup"]
    Layout --> TaskManager["TaskManager"]
    Layout --> Analytics["Analytics"]
    Layout --> Achievements["Achievements"]
    Layout --> Settings["Settings"]
    
    FocusMode --> CountdownOverlay["CountdownOverlay"]
    FocusMode --> ProgressRing["ProgressRing"]
    FocusMode --> AmbientSoundPlayer["AmbientSoundPlayer"]
    FocusMode --> MusicPlayer["MusicPlayer"]
    FocusMode --> useTimer["useTimer Hook"]
```

---

## 🗄 Database Schema

```mermaid
erDiagram
    users ||--o{ tasks : creates
    users ||--o{ subtasks : creates
    users ||--o{ focus_sessions : starts
    users ||--|| user_settings : configures
    users ||--o{ achievements : earns
    users ||--|| streaks : maintains
    tasks ||--o{ subtasks : contains
    tasks ||--o{ focus_sessions : linked_to
    focus_sessions ||--o{ session_notes : has

    users {
        int id PK
        string name
        string email
        string hashed_password
        datetime created_at
    }

    tasks {
        int id PK
        int user_id FK
        string title
        text description
        string priority
        int estimated_minutes
        string status
        text tags
        text notes
        datetime due_date
        int sort_order
        datetime created_at
        datetime updated_at
    }

    subtasks {
        int id PK
        int user_id FK
        int task_id FK
        string title
        text description
        string priority
        int estimated_minutes
        string status
        text tags
        text notes
        datetime due_date
        int sort_order
        datetime created_at
        datetime updated_at
    }

    focus_sessions {
        int id PK
        int user_id FK
        int task_id FK
        string title
        string goal
        int planned_minutes
        int actual_minutes
        int pauses
        string ambient_sound
        int productivity_score
        int mood
        text notes
        int xp_earned
        boolean task_completed
        string status
        datetime created_at
    }

    streaks {
        int id PK
        int user_id FK
        int current_streak
        int longest_streak
        date last_session_date
    }

    achievements {
        int id PK
        int user_id FK
        string badge_name
        string description
        datetime earned_at
    }

    user_settings {
        int id PK
        int user_id FK
        int default_duration
        string theme
        boolean notifications_enabled
        boolean auto_start_breaks
        string preferred_sound
        int sound_volume
        int pomodoro_work
        int pomodoro_break
        boolean ai_coach_enabled
    }

    session_notes {
        int id PK
        int session_id FK
        text content
        datetime created_at
    }
```

---

## 📂 Project Structure

```
focus-sessions/
├── backend/
│   ├── app/
│   │   ├── api/                    # Route handlers
│   │   │   ├── auth.py             # Auth endpoints
│   │   │   ├── tasks.py            # Task CRUD + bulk + filters
│   │   │   ├── sessions.py         # Session lifecycle endpoints
│   │   │   ├── analytics.py        # Dashboard & charts data
│   │   │   ├── achievements.py     # Badge endpoints
│   │   │   ├── settings.py         # User settings + AI coach
│   │   │   └── deps.py             # Auth dependencies
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   ├── subtask.py
│   │   │   ├── session.py
│   │   │   ├── session_note.py
│   │   │   ├── streak.py
│   │   │   ├── achievement.py
│   │   │   └── settings.py
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── core/                   # Config, database, security
│   │   ├── services/               # Business logic
│   │   └── main.py                 # FastAPI app entry
│   ├── alembic/                    # Database migrations
│   ├── tests/                      # Backend tests
│   ├── seed.py                     # Demo data seeder
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Route page components
│   │   │   ├── Landing.tsx         # Welcome/onboarding
│   │   │   ├── Login.tsx           # Login form
│   │   │   ├── Register.tsx        # Registration form
│   │   │   ├── Dashboard.tsx       # Home dashboard
│   │   │   ├── SessionSetup.tsx    # Configure focus session
│   │   │   ├── FocusMode.tsx       # Active focus timer
│   │   │   ├── BreakMode.tsx       # Break timer
│   │   │   ├── SessionComplete.tsx # Post-session review
│   │   │   ├── TaskManager.tsx     # Full task management
│   │   │   ├── Analytics.tsx       # Charts & history
│   │   │   ├── Achievements.tsx    # Badge gallery
│   │   │   └── Settings.tsx        # User preferences
│   │   ├── components/
│   │   │   ├── layout/Layout.tsx   # Sidebar navigation + outlet
│   │   │   ├── focus/
│   │   │   │   ├── CountdownOverlay.tsx
│   │   │   │   └── ProgressRing.tsx
│   │   │   ├── AmbientSoundPlayer.tsx
│   │   │   ├── MusicPlayer.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts        # Auth state (Zustand)
│   │   │   └── useAppStore.ts      # App state (Zustand)
│   │   ├── services/api.ts         # Axios API client
│   │   ├── hooks/useTimer.ts       # Timer hook
│   │   ├── validation/schemas.ts   # Zod validation schemas
│   │   ├── types/index.ts          # TypeScript interfaces
│   │   ├── data/ambientSounds.ts   # Sound definitions
│   │   ├── utils/helpers.ts        # Utility functions
│   │   ├── index.css               # Design system + Tailwind
│   │   ├── App.tsx                 # Router configuration
│   │   └── main.tsx                # React entry point
│   ├── __tests__/                  # Frontend tests
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── docs/                           # Extended documentation
│   ├── ARCHITECTURE.md
│   ├── INSTALLATION.md
│   ├── API.md
│   └── USER_MANUAL.md
│
├── setup.cmd                       # One-click setup
├── start.cmd                       # One-click start
├── test-all.cmd                    # Run all tests
├── build.cmd                       # Production build
└── README.md
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `setup.cmd` | Create venv, install deps, migrate DB, seed data |
| `start.cmd` | Start backend + frontend and open browser |
| `test-all.cmd` | Run backend + frontend tests and build |
| `build.cmd` | Build frontend and verify backend imports |
| `npm run dev` (in `frontend/`) | Frontend dev server (proxies `/api` → :8000) |
| `npm run build` (in `frontend/`) | Production frontend build |
| `npm run test` (in `frontend/`) | Vitest unit tests |
| `pytest` (in `backend/`) | Backend tests |

---

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Installation](docs/INSTALLATION.md)
- [API Reference](docs/API.md)
- [User Manual](docs/USER_MANUAL.md)

---

## 🚀 Production Deployment

### Quick Start with Docker
```bash
# Build and start with Docker Compose
docker-compose up -d

# Check health
curl http://localhost:8000/api/health
curl http://localhost:3000
```

### Deployment Options
- **Docker Compose** (local/VPS) - See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Heroku** - `git push heroku main`
- **AWS ECS/Fargate** - See deployment guide
- **Azure Container Instances** - See deployment guide
- **DigitalOcean App Platform** - Docker-native deployment

### Pre-Production Checklist
Complete the [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) before deploying.

Key steps:
1. Set `ENVIRONMENT=production` in `.env`
2. Change `SECRET_KEY` to a strong random value
3. Configure PostgreSQL database
4. Set `CORS_ORIGINS` to your domain
5. Disable documentation: `DISABLE_DOCS=true`
6. Run migrations: `alembic upgrade head`
7. Enable SSL/TLS with HTTPS
8. Setup monitoring and logging

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up the development environment
- Code style and standards
- Testing requirements
- Pull request process
- Commit message conventions

---

## 🎨 Design System

The app uses a custom design system built on Tailwind CSS with CSS custom properties for theming:

- **4 themes:** Dark (default), Light, Calm Blue, Forest Green
- **Typography:** DM Sans font family
- **Components:** `btn-primary`, `btn-secondary`, `btn-ghost`, `card`, `card-elevated`, `input-field`, `badge-*`, `alert-*`
- **Animations:** Framer Motion for page transitions, layout animations, and micro-interactions
- **Responsive:** Mobile-first design with collapsible sidebar navigation

---

<p align="center">
  Built with 💜 for the ADHD community
</p>
