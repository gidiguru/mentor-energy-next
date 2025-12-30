'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  // Apply theme when it changes
  useEffect(() => {
    const html = document.documentElement;

    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Ensure data-theme is always set for Skeleton
    html.setAttribute('data-theme', 'crimson');
  }, [isDarkMode]);

  // Apply on mount from localStorage
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', 'crimson');

    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const dark = parsed.state?.isDarkMode ?? true;
        if (dark) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      } catch {
        html.classList.add('dark');
      }
    }
  }, []);

  return <>{children}</>;
}
