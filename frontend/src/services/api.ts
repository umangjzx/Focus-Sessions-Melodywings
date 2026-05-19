import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('focus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('focus_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Task {
  id: number;
  user_id: number;
  parent_id: number | null;
  title: string;
  description: string | null;
  priority: string;
  estimated_minutes: number;
  status: string;
  tags: string[];
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  title: string;
  goal?: string | null;
  planned_minutes: number;
  actual_minutes: number;
  pauses: number;
  ambient_sound?: string | null;
  productivity_score: number;
  mood?: number | null;
  notes?: string | null;
  xp_earned: number;
  task_completed: boolean;
  status: string;
  task_title?: string | null;
  task_id?: number | null;
}

export interface DashboardStats {
  today_focus_minutes: number;
  tasks_completed_today: number;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
  total_sessions: number;
  average_session_minutes: number;
  recommended_duration: number;
}

export interface Settings {
  default_duration: number;
  theme: string;
  notifications_enabled: boolean;
  auto_start_breaks: boolean;
  preferred_sound: string | null;
  sound_volume: number;
  pomodoro_work: number;
  pomodoro_break: number;
  ai_coach_enabled: boolean;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ access_token: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string }>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  me: () => api.get<User>('/auth/me'),
};

export const tasksApi = {
  getAll: (params?: { status?: string; priority?: string; search?: string }) =>
    api.get<Task[]>('/tasks', { params }),
  create: (data: {
    title: string;
    description?: string;
    parent_id?: number;
    priority?: string;
    estimated_minutes?: number;
    tags?: string[];
    notes?: string;
    due_date?: string;
  }) => api.post<Task>('/tasks', data),
  update: (id: number, data: Partial<Task> & { tags?: string[] }) => api.put<Task>(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  bulkAction: (ids: number[], action: 'complete' | 'delete' | 'todo' | 'in-progress') =>
    api.post('/tasks/bulk', { ids, action }),
};

export const sessionsApi = {
  start: (data: {
    title: string;
    task_id?: number;
    goal?: string;
    planned_minutes: number;
    ambient_sound?: string;
    pomodoro_work?: number;
    pomodoro_break?: number;
  }) => api.post<Session>('/sessions/start', data),
  pause: (id: number, pauses: number) => api.post<Session>(`/sessions/${id}/pause`, { pauses }),
  resume: (id: number) => api.post<Session>(`/sessions/${id}/resume`),
  complete: (
    id: number,
    data: { actual_minutes: number; pauses: number; mood: number; notes?: string; task_completed: boolean }
  ) => api.post(`/sessions/${id}/complete`, data),
  history: () => api.get<Session[]>('/sessions/history'),
};

export const analyticsApi = {
  dashboard: () => api.get<DashboardStats>('/analytics/dashboard'),
  weekly: () => api.get<{ labels: string[]; minutes: number[] }>('/analytics/weekly'),
  monthly: () => api.get<{ month: string; minutes: number; sessions: number }[]>('/analytics/monthly'),
  heatmap: () => api.get('/analytics/heatmap'),
};

export const achievementsApi = {
  getAll: () => api.get<{ id: number; badge_name: string; description: string; earned_at: string }[]>('/achievements'),
};

export const settingsApi = {
  get: () => api.get<Settings>('/settings'),
  update: (data: Partial<Settings>) => api.put<Settings>('/settings', data),
  coach: (phase: string) => api.get<{ message: string }>(`/settings/coach/${phase}`),
};

export default api;
