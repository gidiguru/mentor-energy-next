import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, userStreaks, eq } from '@/lib/db';

// GET /api/streaks - Get user's streak info
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let streak = await database.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, user.id),
    });

    // Create streak record if doesn't exist
    if (!streak) {
      [streak] = await database.insert(userStreaks).values({
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
      }).returning();
    }

    // Check if streak is still active (activity within last 24 hours)
    const now = new Date();
    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;

    let isActiveToday = false;
    let streakBroken = false;

    if (lastActivity) {
      const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      const daysSinceLastActivity = Math.floor(hoursSinceLastActivity / 24);

      // Check if already logged activity today
      isActiveToday = lastActivity.toDateString() === now.toDateString();

      // Streak is broken if more than 1 full day has passed
      if (daysSinceLastActivity > 1) {
        streakBroken = true;
      }
    }

    return NextResponse.json({
      currentStreak: streakBroken ? 0 : streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      isActiveToday,
      streakBroken,
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
  }
}

// POST /api/streaks - Log activity and update streak
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let streak = await database.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, user.id),
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!streak) {
      // First activity ever
      [streak] = await database.insert(userStreaks).values({
        userId: user.id,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now,
      }).returning();

      return NextResponse.json({
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate,
        isNewStreak: true,
        message: 'Streak started!',
      });
    }

    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    const lastActivityDate = lastActivity
      ? new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      : null;

    // Already logged today
    if (lastActivityDate && lastActivityDate.getTime() === today.getTime()) {
      return NextResponse.json({
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate,
        message: 'Already logged today',
      });
    }

    let newStreak = 1;
    let streakContinued = false;
    let streakBroken = false;

    if (lastActivityDate) {
      const daysSinceLastActivity = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastActivity === 1) {
        // Consecutive day - continue streak
        newStreak = streak.currentStreak + 1;
        streakContinued = true;
      } else if (daysSinceLastActivity > 1) {
        // Streak broken - start new
        newStreak = 1;
        streakBroken = true;
      }
    }

    const newLongestStreak = Math.max(streak.longestStreak, newStreak);

    // Update streak
    const [updatedStreak] = await database.update(userStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: now,
        updatedAt: now,
      })
      .where(eq(userStreaks.id, streak.id))
      .returning();

    return NextResponse.json({
      currentStreak: updatedStreak.currentStreak,
      longestStreak: updatedStreak.longestStreak,
      lastActivityDate: updatedStreak.lastActivityDate,
      streakContinued,
      streakBroken,
      message: streakContinued
        ? `${newStreak} day streak!`
        : streakBroken
          ? 'Streak reset. Starting fresh!'
          : 'Activity logged!',
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}
