import { create } from 'zustand';
import { authApi, User } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('focus_token', data.access_token);
    const me = await authApi.me();
    set({ user: me.data, isAuthenticated: true, isLoading: false });
  },

  register: async (name, email, password) => {
    const { data } = await authApi.register({ name, email, password });
    localStorage.setItem('focus_token', data.access_token);
    const me = await authApi.me();
    set({ user: me.data, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('focus_token');
    authApi.logout().catch(() => {});
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('focus_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('focus_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
