import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, achievements, userAchievements, userStreaks, certificates, userPageProgress, lessonComments, eq, and } from '@/lib/db';

// GET /api/achievements - Get all achievements with user's progress
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

    // Get all achievements
    const allAchievements = await database.query.achievements.findMany({
      orderBy: (a, { asc }) => [asc(a.category), asc(a.points)],
    });

    // Get user's earned achievements
    const earned = await database.query.userAchievements.findMany({
      where: eq(userAchievements.userId, user.id),
    });

    const earnedIds = new Set(earned.map(e => e.achievementId));

    // Calculate total points
    const totalPoints = allAchievements
      .filter(a => earnedIds.has(a.id))
      .reduce((sum, a) => sum + a.points, 0);

    // Map achievements with earned status
    const achievementsWithStatus = allAchievements.map(achievement => ({
      ...achievement,
      earned: earnedIds.has(achievement.id),
      earnedAt: earned.find(e => e.achievementId === achievement.id)?.earnedAt,
    }));

    return NextResponse.json({
      achievements: achievementsWithStatus,
      totalPoints,
      earnedCount: earned.length,
      totalCount: allAchievements.length,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST /api/achievements/check - Check and award any new achievements
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

    // Get user's current achievements
    const earnedAchievements = await database.query.userAchievements.findMany({
      where: eq(userAchievements.userId, user.id),
    });
    const earnedCodes = new Set<string>();

    // Get achievement IDs to codes mapping
    const allAchievements = await database.query.achievements.findMany();
    const achievementMap = new Map(allAchievements.map(a => [a.id, a]));

    for (const earned of earnedAchievements) {
      const achievement = achievementMap.get(earned.achievementId);
      if (achievement) {
        earnedCodes.add(achievement.code);
      }
    }

    // Get user stats
    const [streak, completedLessons, earnedCertificates, commentsCount] = await Promise.all([
      database.query.userStreaks.findFirst({
        where: eq(userStreaks.userId, user.id),
      }),
      database.query.userPageProgress.findMany({
        where: and(
          eq(userPageProgress.userId, user.id),
          eq(userPageProgress.isCompleted, true),
        ),
      }),
      database.query.certificates.findMany({
        where: eq(certificates.userId, user.id),
      }),
      database.query.lessonComments.findMany({
        where: eq(lessonComments.userId, user.id),
      }),
    ]);

    const stats = {
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      lessonsCompleted: completedLessons.length,
      certificatesEarned: earnedCertificates.length,
      commentsPosted: commentsCount.length,
    };

    // Check each achievement
    const newlyEarned: typeof allAchievements = [];

    for (const achievement of allAchievements) {
      if (earnedCodes.has(achievement.code)) continue;

      let shouldAward = false;
      const req = achievement.requirement as Record<string, number> | null;

      switch (achievement.code) {
        case 'first_lesson':
          shouldAward = stats.lessonsCompleted >= 1;
          break;
        case 'lessons_5':
          shouldAward = stats.lessonsCompleted >= 5;
          break;
        case 'lessons_10':
          shouldAward = stats.lessonsCompleted >= 10;
          break;
        case 'lessons_25':
          shouldAward = stats.lessonsCompleted >= 25;
          break;
        case 'lessons_50':
          shouldAward = stats.lessonsCompleted >= 50;
          break;
        case 'lessons_100':
          shouldAward = stats.lessonsCompleted >= 100;
          break;
        case 'streak_3':
          shouldAward = stats.currentStreak >= 3 || stats.longestStreak >= 3;
          break;
        case 'streak_7':
          shouldAward = stats.currentStreak >= 7 || stats.longestStreak >= 7;
          break;
        case 'streak_14':
          shouldAward = stats.currentStreak >= 14 || stats.longestStreak >= 14;
          break;
        case 'streak_30':
          shouldAward = stats.currentStreak >= 30 || stats.longestStreak >= 30;
          break;
        case 'first_certificate':
          shouldAward = stats.certificatesEarned >= 1;
          break;
        case 'certificates_3':
          shouldAward = stats.certificatesEarned >= 3;
          break;
        case 'certificates_5':
          shouldAward = stats.certificatesEarned >= 5;
          break;
        case 'first_comment':
          shouldAward = stats.commentsPosted >= 1;
          break;
        case 'comments_10':
          shouldAward = stats.commentsPosted >= 10;
          break;
        default:
          // Check requirement field if present
          if (req) {
            if (req.lessonsCompleted && stats.lessonsCompleted >= req.lessonsCompleted) {
              shouldAward = true;
            }
            if (req.streak && (stats.currentStreak >= req.streak || stats.longestStreak >= req.streak)) {
              shouldAward = true;
            }
            if (req.certificates && stats.certificatesEarned >= req.certificates) {
              shouldAward = true;
            }
          }
      }

      if (shouldAward) {
        await database.insert(userAchievements).values({
          userId: user.id,
          achievementId: achievement.id,
        });
        newlyEarned.push(achievement);
      }
    }

    return NextResponse.json({
      newAchievements: newlyEarned,
      stats,
      message: newlyEarned.length > 0
        ? `Congratulations! You earned ${newlyEarned.length} new achievement(s)!`
        : 'No new achievements earned',
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 });
  }
}
