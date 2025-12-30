'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useDrawerStore } from '@/lib/stores/drawer';
import { cn } from '@/lib/utils';

interface DrawerProps {
  children: React.ReactNode;
}

export function Drawer({ children }: DrawerProps) {
  const { isOpen, close } = useDrawerStore();

  // Close drawer on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-80 max-w-full transform preset-filled-surface-50-950 shadow-xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={close}
            className="rounded-lg p-2 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Drawer content */}
        {children}
      </div>
    </>
  );
}
