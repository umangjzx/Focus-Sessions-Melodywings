/// <reference types="vite/client" />

interface ElectronAPI {
  tasks: {
    getAll: (userId?: number) => Promise<TaskRow[]>;
    create: (task: Partial<TaskRow>) => Promise<TaskRow>;
    update: (data: Partial<TaskRow> & { id: number }) => Promise<TaskRow>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };
  sessions: {
    start: (config: SessionStartConfig) => Promise<SessionRow>;
    pause: (data: { id: number; pauses?: number }) => Promise<SessionRow>;
    resume: (data: { id: number }) => Promise<SessionRow>;
    complete: (data: SessionCompletePayload) => Promise<SessionCompleteResult>;
    getHistory: (opts?: { userId?: number; limit?: number }) => Promise<SessionRow[]>;
    getActive: (userId?: number) => Promise<SessionRow | undefined>;
  };
  analytics: {
    getDashboard: (userId?: number) => Promise<DashboardStats>;
    getWeeklyStats: (userId?: number) => Promise<WeeklyStats>;
    getHeatmap: (userId?: number) => Promise<HeatmapData>;
    getMonthly: (userId?: number) => Promise<MonthlyStat[]>;
  };
  settings: {
    get: (userId?: number) => Promise<SettingsRow>;
    update: (data: Partial<SettingsRow> & { userId?: number }) => Promise<SettingsRow>;
  };
  music: {
    getLibrary: () => Promise<MusicTrack[]>;
    toggleFavorite: (data: { userId?: number; trackId: string }) => Promise<{ favorited: boolean }>;
  };
  achievements: {
    getAll: (userId?: number) => Promise<AchievementRow[]>;
  };
  notifications: {
    show: (data: { title: string; body: string }) => Promise<{ success: boolean }>;
  };
  quotes: {
    getRandom: () => Promise<string>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}

interface TaskRow {
  id: number;
  user_id: number;
  parent_id?: number | null;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  estimated_minutes: number;
  status: 'todo' | 'in-progress' | 'completed';
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SessionRow {
  id: number;
  user_id: number;
  task_id?: number;
  title: string;
  goal?: string;
  planned_minutes: number;
  actual_minutes: number;
  pauses: number;
  music_used?: string;
  ambient_sound?: string;
  productivity_score: number;
  mood?: number;
  notes?: string;
  xp_earned?: number;
  task_completed?: number;
  started_at?: string;
  completed_at?: string;
  status: string;
  task_title?: string;
}

interface SessionStartConfig {
  title: string;
  task_id?: number;
  goal?: string;
  planned_minutes: number;
  music_used?: string;
  ambient_sound?: string;
  pomodoro_work?: number;
  pomodoro_break?: number;
}

interface SessionCompletePayload {
  id: number;
  actual_minutes: number;
  pauses: number;
  mood: number;
  notes?: string;
  task_completed: boolean;
}

interface SessionCompleteResult {
  session: SessionRow;
  streak: { current_streak: number; longest_streak: number; total_xp: number; level: number };
  xpEarned: number;
  productivityScore: number;
  unlockedAchievements: { badge_name: string; description: string }[];
}

interface DashboardStats {
  todayFocusMinutes: number;
  tasksCompletedToday: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  totalSessions: number;
  averageSessionMinutes: number;
  recommendedDuration: number;
}

interface WeeklyStats {
  labels: string[];
  minutes: number[];
  raw: unknown[];
}

interface HeatmapData {
  heatmap: { hour: number; count: number; minutes: number }[];
  musicStats: { music_used: string; count: number }[];
  completionRate: number;
}

interface MonthlyStat {
  month: string;
  minutes: number;
  sessions: number;
}

interface SettingsRow {
  default_duration: number;
  theme: string;
  notifications_enabled: boolean;
  auto_start_breaks: boolean;
  preferred_music?: string;
  sound_volume: number;
  pomodoro_work: number;
  pomodoro_break: number;
  favoriteTrackIds?: string[];
}

interface MusicTrack {
  id: string;
  title: string;
  category: string;
  artist: string;
}

interface AchievementRow {
  id: number;
  badge_name: string;
  description: string;
  earned_at: string;
}
