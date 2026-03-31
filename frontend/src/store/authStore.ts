import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, adminKey?: string) => Promise<void>;
  makeAdmin: (adminKey: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  init: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) });
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Invalid credentials');
    }
  },

  register: async (name, email, password, adminKey) => {
    set({ isLoading: true });
    try {
      const payload: Record<string, string> = { name, email, password };
      if (adminKey) payload.adminKey = adminKey;
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err?.response?.data?.message || 'Registration failed');
    }
  },

  makeAdmin: async (adminKey) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/make-admin', { adminKey });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err?.response?.data?.message || 'Invalid admin key');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
