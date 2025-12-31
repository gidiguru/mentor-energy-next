import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, userPageProgress, userModuleProgress, userStreaks, userAchievements, certificates, courseEnrollments, learningModules, moduleSections, sectionPages, lessonComments, lessonRatings, eq, desc, and, gte } from '@/lib/db';

interface DailyStats {
  date: string;
  newUsers: number;
  lessonsCompleted: number;
  enrollments: number;
}

interface PopularCourse {
  moduleId: string;
  moduleSlug: string;
  title: string;
  enrollmentCount: number;
  completionRate: number;
  averageProgress: number;
}

interface UserGrowth {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
}

interface EngagementStats {
  totalComments: number;
  totalRatings: number;
  averageRating: number;
  totalBookmarks: number;
  totalNotes: number;
}

interface AdminAnalyticsData {
  // Overview
  totalUsers: number;
  totalModules: number;
  totalLessons: number;
  totalEnrollments: number;
  totalCertificates: number;
  totalAchievementsEarned: number;

  // User growth
  userGrowth: UserGrowth;

  // Course performance
  popularCourses: PopularCourse[];
  overallCompletionRate: number;

  // Engagement
  engagement: EngagementStats;

  // Daily activity (last 30 days)
  dailyStats: DailyStats[];

  // Top performers
  topLearners: {
    id: string;
    name: string;
    lessonsCompleted: number;
    certificatesEarned: number;
  }[];

  // Recent activity
  recentEnrollments: {
    userName: string;
    courseName: string;
    date: string;
  }[];

  recentCertificates: {
    userName: string;
    courseName: string;
    date: string;
  }[];
}

// GET /api/admin/analytics - Get platform-wide analytics (admin only)
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    // Verify admin role
    const currentUser = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all data in parallel
    const [
      allUsers,
      allModules,
      allSections,
      allPages,
      allEnrollments,
      allCertificates,
      allAchievements,
      allPageProgress,
      allModuleProgress,
      allComments,
      allRatings,
      allStreaks,
    ] = await Promise.all([
      database.query.users.findMany(),
      database.query.learningModules.findMany(),
      database.query.moduleSections.findMany(),
      database.query.sectionPages.findMany(),
      database.query.courseEnrollments.findMany({
        with: { user: true, module: true },
        orderBy: [desc(courseEnrollments.enrolledAt)],
      }),
      database.query.certificates.findMany({
        with: { user: true, module: true },
        orderBy: [desc(certificates.completedAt)],
      }),
      database.query.userAchievements.findMany(),
      database.query.userPageProgress.findMany(),
      database.query.userModuleProgress.findMany(),
      database.query.lessonComments.findMany(),
      database.query.lessonRatings.findMany(),
      database.query.userStreaks.findMany(),
    ]);

    // Calculate dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Overview stats
    const totalUsers = allUsers.length;
    const totalModules = allModules.filter(m => m.status === 'published').length;
    const totalLessons = allPages.length;
    const totalEnrollments = allEnrollments.length;
    const totalCertificates = allCertificates.length;
    const totalAchievementsEarned = allAchievements.length;

    // User growth stats
    const newUsersThisWeek = allUsers.filter(u => new Date(u.createdAt) >= oneWeekAgo).length;
    const newUsersThisMonth = allUsers.filter(u => new Date(u.createdAt) >= oneMonthAgo).length;

    // Active users (users with streak activity)
    const activeUsersToday = allStreaks.filter(s =>
      s.lastActivityDate && new Date(s.lastActivityDate) >= today
    ).length;
    const activeUsersThisWeek = allStreaks.filter(s =>
      s.lastActivityDate && new Date(s.lastActivityDate) >= oneWeekAgo
    ).length;

    const userGrowth: UserGrowth = {
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      activeUsersThisWeek,
    };

    // Popular courses
    const courseStats = new Map<string, { enrollments: number; completed: number; totalProgress: number }>();

    for (const enrollment of allEnrollments) {
      const moduleId = enrollment.moduleId;
      const stats = courseStats.get(moduleId) || { enrollments: 0, completed: 0, totalProgress: 0 };
      stats.enrollments++;

      const moduleProgress = allModuleProgress.find(
        mp => mp.moduleId === moduleId && mp.userId === enrollment.userId
      );
      if (moduleProgress) {
        stats.totalProgress += moduleProgress.progressPercentage;
        if (moduleProgress.isCompleted) {
          stats.completed++;
        }
      }

      courseStats.set(moduleId, stats);
    }

    const popularCourses: PopularCourse[] = allModules
      .filter(m => m.status === 'published')
      .map(module => {
        const stats = courseStats.get(module.id) || { enrollments: 0, completed: 0, totalProgress: 0 };
        return {
          moduleId: module.id,
          moduleSlug: module.moduleId,
          title: module.title,
          enrollmentCount: stats.enrollments,
          completionRate: stats.enrollments > 0 ? Math.round((stats.completed / stats.enrollments) * 100) : 0,
          averageProgress: stats.enrollments > 0 ? Math.round(stats.totalProgress / stats.enrollments) : 0,
        };
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 10);

    // Overall completion rate
    const completedModules = allModuleProgress.filter(mp => mp.isCompleted).length;
    const overallCompletionRate = totalEnrollments > 0
      ? Math.round((completedModules / totalEnrollments) * 100)
      : 0;

    // Engagement stats
    const totalCommentsCount = allComments.length;
    const totalRatingsCount = allRatings.length;
    const averageRating = totalRatingsCount > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatingsCount) * 10) / 10
      : 0;

    const engagement: EngagementStats = {
      totalComments: totalCommentsCount,
      totalRatings: totalRatingsCount,
      averageRating,
      totalBookmarks: 0, // Would need to fetch bookmarks
      totalNotes: 0, // Would need to fetch notes
    };

    // Daily stats for last 30 days
    const dailyStats: DailyStats[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dateStr = date.toISOString().split('T')[0];

      const newUsers = allUsers.filter(u => {
        const created = new Date(u.createdAt);
        return created >= date && created < nextDate;
      }).length;

      const lessonsCompleted = allPageProgress.filter(p => {
        if (!p.completedAt) return false;
        const completed = new Date(p.completedAt);
        return completed >= date && completed < nextDate;
      }).length;

      const enrollments = allEnrollments.filter(e => {
        const enrolled = new Date(e.enrolledAt);
        return enrolled >= date && enrolled < nextDate;
      }).length;

      dailyStats.push({ date: dateStr, newUsers, lessonsCompleted, enrollments });
    }

    // Top learners
    const userLessonCounts = new Map<string, number>();
    const userCertCounts = new Map<string, number>();

    for (const progress of allPageProgress) {
      if (progress.isCompleted) {
        userLessonCounts.set(progress.userId, (userLessonCounts.get(progress.userId) || 0) + 1);
      }
    }

    for (const cert of allCertificates) {
      userCertCounts.set(cert.userId, (userCertCounts.get(cert.userId) || 0) + 1);
    }

    const topLearners = Array.from(userLessonCounts.entries())
      .map(([userId, lessonsCompleted]) => {
        const user = allUsers.find(u => u.id === userId);
        return {
          id: userId,
          name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Anonymous' : 'Unknown',
          lessonsCompleted,
          certificatesEarned: userCertCounts.get(userId) || 0,
        };
      })
      .sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)
      .slice(0, 10);

    // Recent enrollments
    const recentEnrollments = allEnrollments
      .slice(0, 10)
      .map(e => ({
        userName: e.user ? [e.user.firstName, e.user.lastName].filter(Boolean).join(' ') || 'Anonymous' : 'Unknown',
        courseName: e.module?.title || 'Unknown Course',
        date: e.enrolledAt.toISOString(),
      }));

    // Recent certificates
    const recentCertificates = allCertificates
      .slice(0, 10)
      .map(c => ({
        userName: c.user ? [c.user.firstName, c.user.lastName].filter(Boolean).join(' ') || 'Anonymous' : 'Unknown',
        courseName: c.module?.title || 'Unknown Course',
        date: c.completedAt.toISOString(),
      }));

    const analytics: AdminAnalyticsData = {
      totalUsers,
      totalModules,
      totalLessons,
      totalEnrollments,
      totalCertificates,
      totalAchievementsEarned,
      userGrowth,
      popularCourses,
      overallCompletionRate,
      engagement,
      dailyStats,
      topLearners,
      recentEnrollments,
      recentCertificates,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
