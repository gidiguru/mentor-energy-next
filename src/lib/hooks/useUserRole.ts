'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserRoleState {
  isAdmin: boolean;
  isMentor: boolean;
  isLoading: boolean;
}

// Shared cache to prevent duplicate fetches across components
let cachedRole: { isAdmin: boolean; isMentor: boolean } | null = null;
let fetchPromise: Promise<{ isAdmin: boolean; isMentor: boolean }> | null = null;

async function fetchUserRole(): Promise<{ isAdmin: boolean; isMentor: boolean }> {
  const [roleRes, profileRes] = await Promise.all([
    fetch('/api/user/role'),
    fetch('/api/user/profile'),
  ]);

  const [roleData, profileData] = await Promise.all([
    roleRes.json(),
    profileRes.json(),
  ]);

  return {
    isAdmin: roleData.isAdmin || false,
    isMentor: profileData.isMentor || false,
  };
}

export function useUserRole(): UserRoleState {
  const { isSignedIn } = useUser();
  const [state, setState] = useState<UserRoleState>({
    isAdmin: cachedRole?.isAdmin || false,
    isMentor: cachedRole?.isMentor || false,
    isLoading: !cachedRole && !!isSignedIn,
  });

  useEffect(() => {
    if (!isSignedIn) {
      cachedRole = null;
      fetchPromise = null;
      setState({ isAdmin: false, isMentor: false, isLoading: false });
      return;
    }

    // If we have cached data, use it
    if (cachedRole) {
      setState({ ...cachedRole, isLoading: false });
      return;
    }

    // If a fetch is already in progress, wait for it
    if (!fetchPromise) {
      fetchPromise = fetchUserRole();
    }

    fetchPromise
      .then((role) => {
        cachedRole = role;
        setState({ ...role, isLoading: false });
      })
      .catch(() => {
        setState({ isAdmin: false, isMentor: false, isLoading: false });
      });
  }, [isSignedIn]);

  return state;
}

// Reset cache on sign out (call this from sign out handler if needed)
export function resetUserRoleCache() {
  cachedRole = null;
  fetchPromise = null;
}
