'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const html = document.documentElement;

    // Toggle dark class
    html.classList.toggle('dark', isDarkMode);

    // Set color-scheme for light-dark() CSS function
    html.style.colorScheme = isDarkMode ? 'dark' : 'light';

    // Ensure data-theme is always set
    html.setAttribute('data-theme', 'crimson');
  }, [isDarkMode]);

  // Apply immediately on first render (for SSR hydration)
  useEffect(() => {
    const html = document.documentElement;

    // Ensure data-theme is set
    html.setAttribute('data-theme', 'crimson');

    // Check localStorage for saved preference
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const dark = parsed.state?.isDarkMode ?? true;
        html.classList.toggle('dark', dark);
        html.style.colorScheme = dark ? 'dark' : 'light';
      } catch {
        // Default to dark
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
      }
    }
  }, []);

  return <>{children}</>;
}
