'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: true, // Default to dark mode like original
      toggleTheme: () =>
        set((state) => {
          const newMode = !state.isDarkMode;
          if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', newMode);
          }
          return { isDarkMode: newMode };
        }),
      setTheme: (dark: boolean) =>
        set(() => {
          if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', dark);
          }
          return { isDarkMode: dark };
        }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined' && state) {
          document.documentElement.classList.toggle('dark', state.isDarkMode);
        }
      },
    }
  )
);
