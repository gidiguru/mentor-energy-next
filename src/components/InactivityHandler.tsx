'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface InactivityHandlerProps {
  // Time in minutes before showing warning (default: 25 minutes)
  warningTime?: number;
  // Time in minutes before auto-logout (default: 30 minutes)
  timeoutTime?: number;
  // Enable/disable the handler
  enabled?: boolean;
}

export default function InactivityHandler({
  warningTime = 25,
  timeoutTime = 30,
  enabled = true,
}: InactivityHandlerProps) {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const showWarningRef = useRef(showWarning);

  // Keep ref in sync with state
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const warningMs = warningTime * 60 * 1000;
  const timeoutMs = timeoutTime * 60 * 1000;
  const warningDuration = timeoutMs - warningMs;

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ redirectUrl: '/auth?timeout=true' });
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/auth?timeout=true';
    }
  }, [signOut]);

  // Check if we should logout based on last activity time
  const checkInactivity = useCallback(() => {
    if (!isSignedIn || !enabled) return;

    const elapsed = Date.now() - lastActivityRef.current;

    if (elapsed >= timeoutMs) {
      // Past timeout - logout immediately
      handleLogout();
    } else if (elapsed >= warningMs) {
      // In warning period - show warning with remaining time
      setShowWarning(true);
      const remaining = Math.max(0, timeoutMs - elapsed);
      setCountdown(Math.floor(remaining / 1000));
    }
  }, [isSignedIn, enabled, timeoutMs, warningMs, handleLogout]);

  // Reset all timers
  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (!isSignedIn || !enabled) return;

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(Math.floor(warningDuration / 1000));

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set logout timer
      logoutTimerRef.current = setTimeout(() => {
        handleLogout();
      }, warningDuration);
    }, warningMs);
  }, [isSignedIn, enabled, warningMs, warningDuration, handleLogout]);

  const handleStayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Handle visibility change (tab becomes active/inactive)
  useEffect(() => {
    if (!isSignedIn || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - check if we should have timed out
        checkInactivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn, enabled, checkInactivity]);

  // Track user activity
  useEffect(() => {
    if (!isSignedIn || !enabled) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity handler to prevent excessive calls
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        // Only reset if we're not in warning mode (use ref for current value)
        if (!showWarningRef.current) {
          lastActivityRef.current = Date.now();
          resetTimers();
        }
      }, 1000);
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup on mount
    resetTimers();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      // Only clear timers if we're unmounting completely (not just re-running due to showWarning change)
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, enabled]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Update countdown when in warning state
  useEffect(() => {
    if (!showWarning || !isSignedIn || !enabled) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeoutMs - elapsed);

      if (remaining <= 0) {
        handleLogout();
      } else {
        setCountdown(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, isSignedIn, enabled, timeoutMs, handleLogout]);

  // Format countdown for display
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if not signed in or disabled
  if (!isSignedIn || !enabled || !showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Session Timeout Warning
            </h3>
            <p className="text-sm text-surface-500">
              You&apos;ve been inactive for a while
            </p>
          </div>
        </div>

        <p className="text-surface-600 dark:text-surface-400 mb-4">
          For your security, you will be automatically logged out in:
        </p>

        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-red-600 dark:text-red-400 font-mono">
            {formatCountdown(countdown)}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Stay Logged In
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-3 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-lg transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}
