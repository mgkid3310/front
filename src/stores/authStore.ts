import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  profileUid: string | null;
  setAuth: (user: User, token: string, refreshToken: string, profileUid: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      profileUid: null,
      setAuth: (user, token, refreshToken, profileUid) => {
        // Store tokens separately for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', refreshToken);
        }
        set({ user, token, refreshToken, profileUid });
      },
      setTokens: (token, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', refreshToken);
        }
        set({ token, refreshToken });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        set({ user: null, token: null, refreshToken: null, profileUid: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
