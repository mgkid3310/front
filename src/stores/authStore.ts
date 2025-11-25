import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  profileUid: string | null;
  setAuth: (user: User, token: string, profileUid: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      profileUid: null,
      setAuth: (user, token, profileUid) => {
        // Also store token separately for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
        }
        set({ user, token, profileUid });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
        set({ user: null, token: null, profileUid: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
