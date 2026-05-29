import { create } from 'zustand';

/**
 * GLOBAL AUTHENTICATION STATE Zustand
 * 
 * small global container for user role and info
 * tracks is_authenticated state and user role so for UI conditional display 
 */

import type {  AuthUser } from '@/features/auth/types/auth';


// The Zustand Shape Model
type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSessionLoading: boolean; // session loading state during the first app render
  setAuth: (user: AuthUser) => void;
  logout: () => void;
  setSessionLoading: (v: boolean) => void;
};

// builds the globally accessible hook
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false, // Updated upon fetching /me endpoint on initial load
  isSessionLoading: true, // true only while AppProvider checks /users/me once on startup
  
  // When `/login` succeeds, we save user info in memory.
  setAuth: (user) => {
    set({ user, isAuthenticated: true });
  },
  
  // Log the user out (we still need to hit a backend /logout endpoint to clear the cookie).
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  setSessionLoading: (v: boolean) => set({ isSessionLoading: v }),
}));