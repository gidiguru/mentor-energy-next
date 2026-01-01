import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, mentorshipSessions, eq, and, or, gte } from '@/lib/db';

// Session limits configuration (same as in main route)
const SESSION_LIMITS = {
  FREE_MONTHLY_SESSIONS: 4,
  PREMIUM_MONTHLY_SESSIONS: 20,
  MAX_DURATION_MINUTES: 90,
  MIN_DURATION_MINUTES: 15,
  MIN_HOURS_BETWEEN_SESSIONS: 24,
  MAX_DAYS_IN_ADVANCE: 30,
};

// GET - Get session usage stats for current user
export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count sessions this month
    const sessionsThisMonth = await database
      .select({
        id: mentorshipSessions.id,
        durationMinutes: mentorshipSessions.durationMinutes,
        status: mentorshipSessions.status,
      })
      .from(mentorshipSessions)
      .where(
        and(
          eq(mentorshipSessions.studentId, user.id),
          gte(mentorshipSessions.createdAt, startOfMonth),
          or(
            eq(mentorshipSessions.status, 'scheduled'),
            eq(mentorshipSessions.status, 'completed')
          )
        )
      );

    const monthlyLimit = user.subscriptionTier === 'premium'
      ? SESSION_LIMITS.PREMIUM_MONTHLY_SESSIONS
      : SESSION_LIMITS.FREE_MONTHLY_SESSIONS;

    const sessionsUsed = sessionsThisMonth.length;
    const sessionsRemaining = Math.max(0, monthlyLimit - sessionsUsed);

    // Calculate total minutes scheduled/completed this month
    const totalMinutesThisMonth = sessionsThisMonth.reduce(
      (sum, s) => sum + (s.durationMinutes || 60),
      0
    );

    // Calculate next reset date (first of next month)
    const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return NextResponse.json({
      usage: {
        sessionsUsed,
        sessionsRemaining,
        monthlyLimit,
        totalMinutesThisMonth,
        subscriptionTier: user.subscriptionTier,
        nextResetDate: nextResetDate.toISOString(),
      },
      limits: {
        maxDurationMinutes: SESSION_LIMITS.MAX_DURATION_MINUTES,
        minDurationMinutes: SESSION_LIMITS.MIN_DURATION_MINUTES,
        minHoursBetweenSessions: SESSION_LIMITS.MIN_HOURS_BETWEEN_SESSIONS,
        maxDaysInAdvance: SESSION_LIMITS.MAX_DAYS_IN_ADVANCE,
      },
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 });
  }
}
