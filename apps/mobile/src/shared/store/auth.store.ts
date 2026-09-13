import { create } from 'zustand';
import { storage } from '../lib/storage';

interface AuthUser { id: string; email: string; fullName: string; currency: string; }

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, accessToken: null, isAuthenticated: false, isLoading: true,
  setAuth: (user, accessToken, refreshToken) => {
    storage.set('accessToken', accessToken);
    storage.set('refreshToken', refreshToken);
    storage.set('user', JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },
  clearAuth: () => {
    storage.delete('accessToken');
    storage.delete('refreshToken');
    storage.delete('user');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  restoreSession: () => {
    const token = storage.getString('accessToken');
    const userStr = storage.getString('user');
    if (token && userStr) {
      try { set({ user: JSON.parse(userStr), accessToken: token, isAuthenticated: true, isLoading: false }); }
      catch { set({ isLoading: false }); }
    } else { set({ isLoading: false }); }
  },
}));
