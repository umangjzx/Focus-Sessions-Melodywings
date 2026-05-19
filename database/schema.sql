-- Focus Sessions - SQLite schema (matches FastAPI models)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  reset_token TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  estimated_minutes INTEGER DEFAULT 25,
  status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'completed')),
  tags TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  estimated_minutes INTEGER DEFAULT 25,
  status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'completed')),
  tags TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER,
  title TEXT NOT NULL,
  goal TEXT,
  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER DEFAULT 0,
  pauses INTEGER DEFAULT 0,
  ambient_sound TEXT,
  pomodoro_work INTEGER,
  pomodoro_break INTEGER,
  productivity_score REAL DEFAULT 0,
  mood INTEGER,
  notes TEXT,
  xp_earned INTEGER DEFAULT 0,
  task_completed INTEGER DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'cancelled')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS session_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES focus_sessions(id)
);

CREATE TABLE IF NOT EXISTS streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_focus_date TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  earned_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, badge_name)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  default_duration INTEGER DEFAULT 25,
  theme TEXT DEFAULT 'dark',
  notifications_enabled INTEGER DEFAULT 1,
  auto_start_breaks INTEGER DEFAULT 1,
  preferred_sound TEXT,
  sound_volume INTEGER DEFAULT 80,
  pomodoro_work INTEGER DEFAULT 25,
  pomodoro_break INTEGER DEFAULT 5,
  ai_coach_enabled INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
