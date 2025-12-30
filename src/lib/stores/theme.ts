'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

function applyTheme(dark: boolean) {
  if (typeof window !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: true, // Default to dark mode like original
      toggleTheme: () =>
        set((state) => {
          const newMode = !state.isDarkMode;
          applyTheme(newMode);
          return { isDarkMode: newMode };
        }),
      setTheme: (dark: boolean) =>
        set(() => {
          applyTheme(dark);
          return { isDarkMode: dark };
        }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.isDarkMode);
        }
      },
    }
  )
);
