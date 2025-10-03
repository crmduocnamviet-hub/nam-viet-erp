import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, session: any) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        setUser: (user) =>
          set((state) => {
            state.user = user;
          }, false, 'setUser'),

        setSession: (session) =>
          set((state) => {
            state.session = session;
          }, false, 'setSession'),

        setAuthenticated: (isAuthenticated) =>
          set((state) => {
            state.isAuthenticated = isAuthenticated;
          }, false, 'setAuthenticated'),

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }, false, 'setLoading'),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }, false, 'setError'),

        login: (user, session) =>
          set((state) => {
            state.user = user;
            state.session = session;
            state.isAuthenticated = true;
            state.error = null;
          }, false, 'login'),

        logout: () =>
          set((state) => {
            state.user = null;
            state.session = null;
            state.isAuthenticated = false;
            state.error = null;
          }, false, 'logout'),

        updateUser: (updates) =>
          set((state) => {
            if (state.user) {
              Object.assign(state.user, updates);
            }
          }, false, 'updateUser'),
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
