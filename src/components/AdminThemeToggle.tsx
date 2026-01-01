'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/theme';

export default function AdminThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 w-9 h-9" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-surface-600 dark:text-surface-400" />
      ) : (
        <Moon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
      )}
    </button>
  );
}
