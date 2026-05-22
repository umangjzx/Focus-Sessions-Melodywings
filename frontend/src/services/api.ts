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

export type CoachSource = 'ollama' | 'fallback' | 'disabled';

export type CoachClientParams = {
  page?: string;
  planned_minutes?: number;
  session_title?: string;
  task_title?: string;
  goal?: string;
  in_focus_session?: boolean;
};

export const settingsApi = {
  get: () => api.get<Settings>('/settings'),
  update: (data: Partial<Settings>) => api.put<Settings>('/settings', data),
  coach: (phase: string, client?: CoachClientParams) =>
    api.get<{ message: string; source?: CoachSource }>(`/settings/coach/${phase}`, {
      params: client,
    }),
  coachGreeting: (client?: CoachClientParams) =>
    api.get<{ message: string; source: CoachSource | 'system' }>('/settings/coach/greeting', {
      params: client,
    }),
  coachStatus: () =>
    api.get<{
      ollama_enabled: boolean;
      ollama_model: string;
      ollama_base_url: string;
      ollama_ready: boolean;
    }>('/settings/coach/status'),
  coachChat: (
    messages: { role: 'user' | 'assistant'; content: string }[],
    client?: CoachClientParams,
  ) =>
    api.post<{ message: string; source: CoachSource }>('/settings/coach/chat', {
      messages,
      client: client ?? undefined,
    }),
};

export interface Meeting {
  id: number;
  title: string;
  room_code: string;
  host_id: number;
  host_name?: string | null;
  status: string;
  participant_count?: number;
  ready_count?: number;
  online_count?: number;
  remaining_seconds?: number | null;
  duration_minutes?: number | null;
  created_at?: string | null;
}

export interface MeetingParticipant {
  id: number;
  name: string;
  email: string;
  is_host?: boolean;
  is_ready?: boolean;
  online?: boolean;
}

export interface MeetingSync {
  id: number;
  title: string;
  room_code: string;
  host_id: number;
  host_name?: string | null;
  status: string;
  remaining_seconds: number | null;
  duration_minutes: number | null;
  participant_count: number;
  ready_count: number;
  online_count: number;
  participants: MeetingParticipant[];
}

export interface MeetingSummary {
  title: string;
  room_code: string;
  status: string;
  participant_count: number;
  duration_minutes: number;
  focused_minutes: number | null;
  host_name?: string | null;
}

export interface JoinMeetingResult {
  message: string;
  room_code: string;
  meeting: Meeting;
}

export const meetingsApi = {
  create: (title: string) =>
    api.post<{
      meeting_id: number;
      room_code: string;
      host_id: number;
      status: string;
      meeting: Meeting;
    }>('/meetings/create', null, { params: { title } }),
  getLatestAvailable: () => api.get<Meeting>('/meetings/latest/available'),
  joinLatest: () => api.post<JoinMeetingResult>('/meetings/join-latest'),
  join: (roomCode: string) =>
    api.post<JoinMeetingResult>(`/meetings/join/${roomCode.toUpperCase()}`),
  get: (roomCode: string) => api.get<Meeting>(`/meetings/${roomCode.toUpperCase()}`),
  getState: (roomCode: string) =>
    api.get<MeetingSync>(`/meetings/${roomCode.toUpperCase()}/state`),
  getSummary: (roomCode: string) =>
    api.get<MeetingSummary>(`/meetings/${roomCode.toUpperCase()}/summary`),
  getParticipants: (roomCode: string) =>
    api.get<MeetingParticipant[]>(`/meetings/${roomCode.toUpperCase()}/participants`),
  start: (roomCode: string, durationMinutes = 25) =>
    api.post<{ status: string; started_at: string; duration_minutes: number }>(
      `/meetings/${roomCode.toUpperCase()}/start`,
      null,
      { params: { duration_minutes: durationMinutes } }
    ),
};

export default api;
