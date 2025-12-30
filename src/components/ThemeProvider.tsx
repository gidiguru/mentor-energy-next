'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return <>{children}</>;
}
