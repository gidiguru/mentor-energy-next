import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';

// Re-export client-safe error utilities for server use
export type { ClerkError } from './clerk-errors';
export { isClerkError, getErrorMessage } from './clerk-errors';

export interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  firstName: string | null;
  lastName: string | null;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: NextResponse | null;
}

/**
 * Get the authenticated user from the database.
 * Returns the user object or an error response.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const database = db();
  const user = await database.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
    };
  }

  return {
    user: user as AuthenticatedUser,
    error: null,
  };
}

/**
 * Require authenticated user with admin role.
 * Returns the user object or an error response.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await getAuthenticatedUser();

  if (result.error) {
    return result;
  }

  if (result.user?.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
    };
  }

  return result;
}

/**
 * Require authenticated user with mentor role.
 * Returns the user object or an error response.
 */
export async function requireMentor(): Promise<AuthResult> {
  const result = await getAuthenticatedUser();

  if (result.error) {
    return result;
  }

  if (result.user?.role !== 'mentor' && result.user?.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden: Mentor access required' }, { status: 403 }),
    };
  }

  return result;
}
