import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, userAchievements, achievements, certificates, userPageProgress, userStreaks, eq, desc } from '@/lib/db';

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
    const type = searchParams.get('type') || 'points'; // points, lessons, streaks, certificates
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
      // Points leaderboard (based on achievement points)
      const allUsers = await database.query.users.findMany({
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      });

      const userPoints: Map<string, number> = new Map();

      // Get all achievements with points
      const allAchievements = await database.query.achievements.findMany();
      const achievementPoints = new Map(allAchievements.map(a => [a.id, a.points]));

      // Get all user achievements
      const allUserAchievements = await database.query.userAchievements.findMany();

      for (const ua of allUserAchievements) {
        const points = achievementPoints.get(ua.achievementId) || 0;
        userPoints.set(ua.userId, (userPoints.get(ua.userId) || 0) + points);
      }

      leaderboard = allUsers
        .map(user => ({
          rank: 0,
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          value: userPoints.get(user.id) || 0,
          isCurrentUser: currentUser?.id === user.id,
        }))
        .filter(u => u.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((user, index) => ({ ...user, rank: index + 1 }));

    } else if (type === 'lessons') {
      // Lessons completed leaderboard
      const allUsers = await database.query.users.findMany({
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      });

      const userLessons: Map<string, number> = new Map();

      const allProgress = await database.query.userPageProgress.findMany({
        where: eq(userPageProgress.isCompleted, true),
      });

      for (const progress of allProgress) {
        userLessons.set(progress.userId, (userLessons.get(progress.userId) || 0) + 1);
      }

      leaderboard = allUsers
        .map(user => ({
          rank: 0,
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          value: userLessons.get(user.id) || 0,
          isCurrentUser: currentUser?.id === user.id,
        }))
        .filter(u => u.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((user, index) => ({ ...user, rank: index + 1 }));

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
      // Certificates earned leaderboard
      const allUsers = await database.query.users.findMany({
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      });

      const userCerts: Map<string, number> = new Map();

      const allCerts = await database.query.certificates.findMany();

      for (const cert of allCerts) {
        userCerts.set(cert.userId, (userCerts.get(cert.userId) || 0) + 1);
      }

      leaderboard = allUsers
        .map(user => ({
          rank: 0,
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          value: userCerts.get(user.id) || 0,
          isCurrentUser: currentUser?.id === user.id,
        }))
        .filter(u => u.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((user, index) => ({ ...user, rank: index + 1 }));
    }

    // Get current user's rank if not in top list
    let currentUserRank = null;
    if (currentUser) {
      const userInList = leaderboard.find(u => u.isCurrentUser);
      if (!userInList) {
        // Calculate user's rank (simplified - in production, use SQL window functions)
        const userValue = leaderboard.length > 0
          ? leaderboard.find(u => u.userId === currentUser.id)?.value || 0
          : 0;
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
