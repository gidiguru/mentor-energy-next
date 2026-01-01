import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';

/**
 * Type for Clerk authentication errors.
 * Clerk errors have a specific structure with an errors array.
 */
export interface ClerkError {
  errors?: Array<{
    code: string;
    message: string;
    longMessage?: string;
    meta?: Record<string, unknown>;
  }>;
  status?: number;
  clerkTraceId?: string;
}

/**
 * Type guard to check if an error is a Clerk error.
 */
export function isClerkError(error: unknown): error is ClerkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as ClerkError).errors)
  );
}

/**
 * Extract user-friendly error message from Clerk error or unknown error.
 */
export function getErrorMessage(error: unknown, fallback: string = 'Something went wrong'): string {
  if (isClerkError(error)) {
    return error.errors?.[0]?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

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
