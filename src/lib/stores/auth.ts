'use client';

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { User as DBUser } from '@/lib/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: DBUser | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: DBUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, session: null, profile: null }),
}));
