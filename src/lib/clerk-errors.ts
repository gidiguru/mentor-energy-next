/**
 * Type for Clerk authentication errors.
 * Clerk errors have a specific structure with an errors array.
 * This file is safe to import in both client and server components.
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
