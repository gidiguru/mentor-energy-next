import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, userAchievements, achievements, certificates, userPageProgress, userStreaks, eq } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET /api/leaderboard - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    const database = db();
    let currentUser = null;

    if (clerkId) {
      currentUser = await database.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'points';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    let leaderboard: Array<{
      rank: number;
      userId: string;
      firstName: string | null;
      lastName: string | null;
      profilePicture: string | null;
      value: number;
      isCurrentUser: boolean;
    }> = [];

    if (type === 'points') {
      // Points leaderboard using SQL aggregation
      const pointsResult = await database
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
          totalPoints: sql<number>`COALESCE(SUM(${achievements.points}), 0)`.as('total_points'),
        })
        .from(users)
        .leftJoin(userAchievements, eq(users.id, userAchievements.userId))
        .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .groupBy(users.id, users.firstName, users.lastName, users.profilePicture)
        .having(sql`COALESCE(SUM(${achievements.points}), 0) > 0`)
        .orderBy(sql`total_points DESC`)
        .limit(limit);

      leaderboard = pointsResult.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        profilePicture: row.profilePicture,
        value: Number(row.totalPoints),
        isCurrentUser: currentUser?.id === row.userId,
      }));

    } else if (type === 'lessons') {
      // Lessons completed using SQL aggregation
      const lessonsResult = await database
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
          lessonCount: sql<number>`COUNT(${userPageProgress.id})`.as('lesson_count'),
        })
        .from(users)
        .innerJoin(userPageProgress, eq(users.id, userPageProgress.userId))
        .where(eq(userPageProgress.isCompleted, true))
        .groupBy(users.id, users.firstName, users.lastName, users.profilePicture)
        .orderBy(sql`lesson_count DESC`)
        .limit(limit);

      leaderboard = lessonsResult.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        profilePicture: row.profilePicture,
        value: Number(row.lessonCount),
        isCurrentUser: currentUser?.id === row.userId,
      }));

    } else if (type === 'streaks') {
      // Longest streak leaderboard
      const streaks = await database.query.userStreaks.findMany({
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
        orderBy: (s, { desc }) => [desc(s.longestStreak)],
        limit,
      });

      leaderboard = streaks
        .filter(s => s.longestStreak > 0)
        .map((streak, index) => ({
          rank: index + 1,
          userId: streak.user.id,
          firstName: streak.user.firstName,
          lastName: streak.user.lastName,
          profilePicture: streak.user.profilePicture,
          value: streak.longestStreak,
          isCurrentUser: currentUser?.id === streak.user.id,
        }));

    } else if (type === 'certificates') {
      // Certificates using SQL aggregation
      const certsResult = await database
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
          certCount: sql<number>`COUNT(${certificates.id})`.as('cert_count'),
        })
        .from(users)
        .innerJoin(certificates, eq(users.id, certificates.userId))
        .groupBy(users.id, users.firstName, users.lastName, users.profilePicture)
        .orderBy(sql`cert_count DESC`)
        .limit(limit);

      leaderboard = certsResult.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        profilePicture: row.profilePicture,
        value: Number(row.certCount),
        isCurrentUser: currentUser?.id === row.userId,
      }));
    }

    // Get current user's rank if not in top list
    let currentUserRank = null;
    if (currentUser) {
      const userInList = leaderboard.find(u => u.isCurrentUser);
      if (!userInList) {
        const userValue = leaderboard.find(u => u.userId === currentUser.id)?.value || 0;
        currentUserRank = {
          rank: leaderboard.filter(u => u.value > userValue).length + 1,
          value: userValue,
        };
      }
    }

    return NextResponse.json({
      leaderboard,
      type,
      currentUserRank,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
