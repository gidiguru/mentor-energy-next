import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, userPageProgress, userModuleProgress, userStreaks, userAchievements, achievements, certificates, courseEnrollments, learningModules, moduleSections, sectionPages, eq, and, desc } from '@/lib/db';

interface WeeklyActivity {
  date: string;
  lessonsCompleted: number;
}

interface CourseProgress {
  moduleId: string;
  moduleSlug: string;
  title: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt: Date | null;
}

interface RecentActivity {
  type: 'lesson_completed' | 'certificate_earned' | 'achievement_unlocked';
  title: string;
  description: string;
  date: Date;
  icon: string;
}

export interface AnalyticsData {
  // Overview stats
  lessonsCompleted: number;
  totalLessonsViewed: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  achievementsUnlocked: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;

  // Time-based data
  weeklyActivity: WeeklyActivity[];

  // Course breakdown
  courseProgress: CourseProgress[];

  // Recent activity
  recentActivity: RecentActivity[];

  // Leaderboard position
  leaderboardRank: number | null;
}

// GET /api/analytics - Get learning analytics for current user
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all analytics data in parallel
    const [
      pageProgressData,
      moduleProgressData,
      streakData,
      userAchievementsData,
      certificatesData,
      enrollmentsData,
    ] = await Promise.all([
      // Page progress - lessons completed and viewed
      database.query.userPageProgress.findMany({
        where: eq(userPageProgress.userId, user.id),
      }),

      // Module progress
      database.query.userModuleProgress.findMany({
        where: eq(userModuleProgress.userId, user.id),
        with: {
          module: true,
        },
      }),

      // Streak data
      database.query.userStreaks.findFirst({
        where: eq(userStreaks.userId, user.id),
      }),

      // Achievements with details
      database.query.userAchievements.findMany({
        where: eq(userAchievements.userId, user.id),
        with: {
          achievement: true,
        },
        orderBy: [desc(userAchievements.earnedAt)],
      }),

      // Certificates
      database.query.certificates.findMany({
        where: eq(certificates.userId, user.id),
        with: {
          module: true,
        },
        orderBy: [desc(certificates.completedAt)],
      }),

      // Enrollments with module details
      database.query.courseEnrollments.findMany({
        where: eq(courseEnrollments.userId, user.id),
        with: {
          module: {
            with: {
              sections: {
                with: {
                  pages: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate overview stats
    const lessonsCompleted = pageProgressData.filter(p => p.isCompleted).length;
    const totalLessonsViewed = pageProgressData.filter(p => p.isViewed).length;
    const coursesEnrolled = enrollmentsData.length;
    const coursesCompleted = moduleProgressData.filter(m => m.isCompleted).length;
    const certificatesEarned = certificatesData.length;
    const achievementsUnlocked = userAchievementsData.length;
    const totalPoints = userAchievementsData.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);
    const currentStreak = streakData?.currentStreak || 0;
    const longestStreak = streakData?.longestStreak || 0;

    // Calculate weekly activity (last 7 days)
    const weeklyActivity: WeeklyActivity[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const lessonsOnDay = pageProgressData.filter(p => {
        if (!p.completedAt) return false;
        const completedDate = new Date(p.completedAt);
        return completedDate >= date && completedDate < nextDate;
      }).length;

      weeklyActivity.push({
        date: date.toISOString().split('T')[0],
        lessonsCompleted: lessonsOnDay,
      });
    }

    // Calculate course progress
    const courseProgress: CourseProgress[] = enrollmentsData.map(enrollment => {
      const module = enrollment.module;
      const totalLessons = module.sections.reduce((sum, s) => sum + s.pages.length, 0);
      const pageIds = module.sections.flatMap(s => s.pages.map(p => p.id));
      const completedLessons = pageProgressData.filter(
        p => pageIds.includes(p.pageId) && p.isCompleted
      ).length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const moduleProgress = moduleProgressData.find(m => m.moduleId === module.id);

      return {
        moduleId: module.id,
        moduleSlug: module.moduleId,
        title: module.title,
        progress,
        completedLessons,
        totalLessons,
        lastAccessedAt: moduleProgress?.lastAccessedAt || null,
      };
    }).sort((a, b) => {
      // Sort by last accessed, most recent first
      if (!a.lastAccessedAt && !b.lastAccessedAt) return 0;
      if (!a.lastAccessedAt) return 1;
      if (!b.lastAccessedAt) return -1;
      return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
    });

    // Build recent activity feed
    const recentActivity: RecentActivity[] = [];

    // Add recent lesson completions
    const recentCompletedLessons = pageProgressData
      .filter(p => p.isCompleted && p.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5);

    // Batch fetch page titles to avoid N+1 query
    const recentPageIds = recentCompletedLessons.map(l => l.pageId);
    const recentPages = recentPageIds.length > 0
      ? await database.query.sectionPages.findMany({
          where: (pages, { inArray }) => inArray(pages.id, recentPageIds),
          columns: { id: true, title: true },
        })
      : [];
    const pageMap = new Map(recentPages.map(p => [p.id, p.title]));

    for (const lesson of recentCompletedLessons) {
      const pageTitle = pageMap.get(lesson.pageId);
      if (pageTitle) {
        recentActivity.push({
          type: 'lesson_completed',
          title: 'Lesson Completed',
          description: pageTitle,
          date: lesson.completedAt!,
          icon: '📚',
        });
      }
    }

    // Add recent certificates
    for (const cert of certificatesData.slice(0, 3)) {
      recentActivity.push({
        type: 'certificate_earned',
        title: 'Certificate Earned',
        description: cert.module?.title || 'Course completed',
        date: cert.completedAt,
        icon: '🎓',
      });
    }

    // Add recent achievements
    for (const ua of userAchievementsData.slice(0, 3)) {
      recentActivity.push({
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked',
        description: ua.achievement?.name || 'New achievement',
        date: ua.earnedAt,
        icon: ua.achievement?.icon || '🏆',
      });
    }

    // Sort by date and take top 10
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const topRecentActivity = recentActivity.slice(0, 10);

    // Calculate leaderboard rank based on total points
    let leaderboardRank: number | null = null;
    try {
      // Count users with more points
      const allUserAchievements = await database.query.userAchievements.findMany({
        with: {
          achievement: true,
        },
      });

      const userPointsMap = new Map<string, number>();
      for (const ua of allUserAchievements) {
        const points = userPointsMap.get(ua.userId) || 0;
        userPointsMap.set(ua.userId, points + (ua.achievement?.points || 0));
      }

      const sortedUsers = Array.from(userPointsMap.entries())
        .sort((a, b) => b[1] - a[1]);

      const userIndex = sortedUsers.findIndex(([userId]) => userId === user.id);
      if (userIndex !== -1) {
        leaderboardRank = userIndex + 1;
      }
    } catch (err) {
      console.error('Error calculating leaderboard rank:', err);
    }

    const analytics: AnalyticsData = {
      lessonsCompleted,
      totalLessonsViewed,
      coursesEnrolled,
      coursesCompleted,
      certificatesEarned,
      achievementsUnlocked,
      totalPoints,
      currentStreak,
      longestStreak,
      weeklyActivity,
      courseProgress,
      recentActivity: topRecentActivity,
      leaderboardRank,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
