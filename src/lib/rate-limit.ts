import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory rate limiter (for serverless, consider using Redis or Upstash)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for an identifier (e.g., user ID or IP)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}`;
  const windowMs = options.windowSeconds * 1000;

  let entry = rateLimitMap.get(key);

  // If no entry or window has expired, create a new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitMap.set(key, entry);
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

// Pre-configured rate limiters for common use cases
export const rateLimits = {
  /** Standard API: 100 requests per minute */
  standard: { limit: 100, windowSeconds: 60 },
  /** Strict: 10 requests per minute (for sensitive operations) */
  strict: { limit: 10, windowSeconds: 60 },
  /** Upload: 20 requests per hour */
  upload: { limit: 20, windowSeconds: 3600 },
  /** Comment: 30 requests per hour */
  comment: { limit: 30, windowSeconds: 3600 },
  /** Auth: 5 requests per 15 minutes */
  auth: { limit: 5, windowSeconds: 900 },
};
