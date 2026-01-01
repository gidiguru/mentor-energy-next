'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme';

// Script to run before hydration to prevent flash
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme-storage');
      var isDark = true; // default to dark
      if (stored) {
        var parsed = JSON.parse(stored);
        isDark = parsed.state?.isDarkMode ?? true;
      }
      var html = document.documentElement;
      if (isDark) {
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
      } else {
        html.classList.remove('dark');
        html.style.colorScheme = 'light';
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  })();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  // Apply theme when it changes
  useEffect(() => {
    const html = document.documentElement;

    if (isDarkMode) {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }

    // Ensure data-theme is always set for Skeleton
    html.setAttribute('data-theme', 'crimson');
  }, [isDarkMode]);

  // Apply on mount from localStorage (backup for SSR)
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
          html.style.colorScheme = 'dark';
        } else {
          html.classList.remove('dark');
          html.style.colorScheme = 'light';
        }
      } catch {
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
      }
    } else {
      // No stored preference - default to dark
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    }
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  );
}
