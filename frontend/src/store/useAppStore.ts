import { create } from 'zustand';
import { DashboardStats, Settings } from '../services/api';
import { settingsApi } from '../services/api';

export type AppTheme = 'dark' | 'light';
export type ActiveSessionConfig = {
  dbSessionId: number;
  title: string;
  taskTitle?: string;
  goal?: string;
  plannedMinutes: number;
  pomodoroWork?: number;
  pomodoroBreak?: number;
  ambientSound?: string;
  taskId?: number;
  autoStartBreaks: boolean;
  strictMode: boolean;
};

interface AppState {
  theme: AppTheme;
  dashboard: DashboardStats | null;
  settings: Settings | null;
  activeSession: ActiveSessionConfig | null;
  lastCompleteResult: Record<string, unknown> | null;
  unlockedBadges: { badge_name: string; description: string }[];

  setTheme: (theme: AppTheme) => void;
  setDashboard: (d: DashboardStats) => void;
  setSettings: (s: Settings) => void;
  setActiveSession: (s: ActiveSessionConfig | null) => void;
  setLastCompleteResult: (r: Record<string, unknown> | null) => void;
  setUnlockedBadges: (b: { badge_name: string; description: string }[]) => void;
  loadInitialData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  dashboard: null,
  settings: null,
  activeSession: null,
  lastCompleteResult: null,
  unlockedBadges: [],

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  setDashboard: (dashboard) => set({ dashboard }),
  setSettings: (settings) => set({ settings }),
  setActiveSession: (activeSession) => set({ activeSession }),
  setLastCompleteResult: (lastCompleteResult) => set({ lastCompleteResult }),
  setUnlockedBadges: (unlockedBadges) => set({ unlockedBadges }),

  loadInitialData: async () => {
    const { analyticsApi } = await import('../services/api');
    const [dashRes, settingsRes] = await Promise.all([
      analyticsApi.dashboard(),
      settingsApi.get(),
    ]);
    const theme = 'light' as AppTheme;
    document.documentElement.setAttribute('data-theme', theme);
    set({ dashboard: dashRes.data, settings: settingsRes.data, theme });
  },
}));
