import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, userPageProgress, userModuleProgress, sectionPages, moduleSections, learningModules, userStreaks, achievements, userAchievements, certificates, lessonComments, eq, and } from '@/lib/db';

// GET /api/progress?moduleId=xxx - Get all page progress for a module
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    const database = db();

    // Get user from clerk ID
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the module
    const module = await database.query.learningModules.findFirst({
      where: eq(learningModules.moduleId, moduleId),
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get all sections and pages for this module
    const sections = await database.query.moduleSections.findMany({
      where: eq(moduleSections.moduleId, module.id),
      with: {
        pages: true,
      },
    });

    // Get all page IDs
    const pageIds = sections.flatMap(s => s.pages.map(p => p.id));

    // Get user's progress for all pages in this module
    const progress = await database.query.userPageProgress.findMany({
      where: and(
        eq(userPageProgress.userId, user.id),
      ),
    });

    // Filter to only pages in this module
    const moduleProgress = progress.filter(p => pageIds.includes(p.pageId));

    // Get module-level progress
    const moduleProgressRecord = await database.query.userModuleProgress.findFirst({
      where: and(
        eq(userModuleProgress.userId, user.id),
        eq(userModuleProgress.moduleId, module.id),
      ),
    });

    // Build a map of pageId -> isCompleted
    const completedPages: Record<string, boolean> = {};
    moduleProgress.forEach(p => {
      completedPages[p.pageId] = p.isCompleted;
    });

    // Calculate overall progress
    const totalPages = pageIds.length;
    const completedCount = moduleProgress.filter(p => p.isCompleted).length;
    const progressPercentage = totalPages > 0 ? Math.round((completedCount / totalPages) * 100) : 0;

    return NextResponse.json({
      completedPages,
      totalPages,
      completedCount,
      progressPercentage,
      moduleProgress: moduleProgressRecord || null,
      userId: user.id,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// POST /api/progress - Mark a page as complete or incomplete
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, moduleId, completed = true } = body; // completed defaults to true for backwards compatibility

    if (!pageId || !moduleId) {
      return NextResponse.json({ error: 'pageId and moduleId are required' }, { status: 400 });
    }

    const database = db();

    // Get user from clerk ID
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the module
    const module = await database.query.learningModules.findFirst({
      where: eq(learningModules.moduleId, moduleId),
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Verify the page exists
    const page = await database.query.sectionPages.findFirst({
      where: eq(sectionPages.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Upsert page progress
    const existingProgress = await database.query.userPageProgress.findFirst({
      where: and(
        eq(userPageProgress.userId, user.id),
        eq(userPageProgress.pageId, pageId),
      ),
    });

    if (existingProgress) {
      // Update existing progress
      await database
        .update(userPageProgress)
        .set({
          isCompleted: completed,
          isViewed: true,
          completedAt: completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(userPageProgress.id, existingProgress.id));
    } else {
      // Insert new progress
      await database.insert(userPageProgress).values({
        userId: user.id,
        pageId: pageId,
        isCompleted: completed,
        isViewed: true,
        completedAt: completed ? new Date() : null,
      });
    }

    // Update module progress
    const sections = await database.query.moduleSections.findMany({
      where: eq(moduleSections.moduleId, module.id),
      with: {
        pages: true,
      },
    });

    const allPageIds = sections.flatMap(s => s.pages.map(p => p.id));
    const allProgress = await database.query.userPageProgress.findMany({
      where: eq(userPageProgress.userId, user.id),
    });

    const modulePageProgress = allProgress.filter(p => allPageIds.includes(p.pageId));
    const completedCount = modulePageProgress.filter(p => p.isCompleted).length;
    const totalPages = allPageIds.length;
    const progressPercentage = totalPages > 0 ? Math.round((completedCount / totalPages) * 100) : 0;
    const isModuleCompleted = completedCount === totalPages;

    // Upsert module progress
    const existingModuleProgress = await database.query.userModuleProgress.findFirst({
      where: and(
        eq(userModuleProgress.userId, user.id),
        eq(userModuleProgress.moduleId, module.id),
      ),
    });

    if (existingModuleProgress) {
      await database
        .update(userModuleProgress)
        .set({
          progressPercentage,
          isCompleted: isModuleCompleted,
          completedAt: isModuleCompleted ? new Date() : null,
          currentPageId: pageId,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userModuleProgress.id, existingModuleProgress.id));
    } else {
      await database.insert(userModuleProgress).values({
        userId: user.id,
        moduleId: module.id,
        progressPercentage,
        isCompleted: isModuleCompleted,
        completedAt: isModuleCompleted ? new Date() : null,
        currentPageId: pageId,
      });
    }

    // Update streak if marking as complete
    if (completed) {
      await updateStreak(database, user.id);
      // Check for new achievements in the background
      checkAndAwardAchievements(database, user.id).catch(err =>
        console.error('Error checking achievements:', err)
      );
    }

    // Auto-generate certificate when module is completed
    let certificate = null;
    if (isModuleCompleted) {
      certificate = await autoGenerateCertificate(database, user.id, module.id);
    }

    return NextResponse.json({
      success: true,
      completedCount,
      totalPages,
      progressPercentage,
      isModuleCompleted,
      certificate,
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}

// Helper function to check and award achievements
async function checkAndAwardAchievements(database: ReturnType<typeof db>, userId: string) {
  try {
    // Get user's current achievements
    const earnedAchievements = await database.query.userAchievements.findMany({
      where: eq(userAchievements.userId, userId),
    });
    const earnedCodes = new Set<string>();

    // Get all achievements
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
        where: eq(userStreaks.userId, userId),
      }),
      database.query.userPageProgress.findMany({
        where: and(
          eq(userPageProgress.userId, userId),
          eq(userPageProgress.isCompleted, true),
        ),
      }),
      database.query.certificates.findMany({
        where: eq(certificates.userId, userId),
      }),
      database.query.lessonComments.findMany({
        where: eq(lessonComments.userId, userId),
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
    for (const achievement of allAchievements) {
      if (earnedCodes.has(achievement.code)) continue;

      let shouldAward = false;

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
      }

      if (shouldAward) {
        await database.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
    // Don't throw - achievement check shouldn't fail the main request
  }
}

// Helper function to update user streak
async function updateStreak(database: ReturnType<typeof db>, userId: string) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let streak = await database.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, userId),
    });

    if (!streak) {
      // First activity ever
      await database.insert(userStreaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now,
      });
      return;
    }

    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    const lastActivityDate = lastActivity
      ? new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate())
      : null;

    // Already logged today
    if (lastActivityDate && lastActivityDate.getTime() === today.getTime()) {
      return;
    }

    let newStreak = 1;

    if (lastActivityDate) {
      const daysSinceLastActivity = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastActivity === 1) {
        // Consecutive day - continue streak
        newStreak = streak.currentStreak + 1;
      }
      // If > 1 day, streak resets to 1
    }

    const newLongestStreak = Math.max(streak.longestStreak, newStreak);

    await database.update(userStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: now,
        updatedAt: now,
      })
      .where(eq(userStreaks.id, streak.id));
  } catch (error) {
    console.error('Error updating streak:', error);
    // Don't throw - streak update shouldn't fail the main request
  }
}

// Helper function to auto-generate certificate when module is completed
async function autoGenerateCertificate(database: ReturnType<typeof db>, userId: string, moduleId: string) {
  try {
    // Check if certificate already exists
    const existingCert = await database.query.certificates.findFirst({
      where: and(
        eq(certificates.userId, userId),
        eq(certificates.moduleId, moduleId),
      ),
    });

    if (existingCert) {
      // Certificate already exists, return it
      return existingCert;
    }

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create certificate
    const [newCertificate] = await database.insert(certificates).values({
      userId,
      moduleId,
      certificateNumber,
      completedAt: new Date(),
    }).returning();

    console.log(`Auto-generated certificate ${certificateNumber} for user ${userId}, module ${moduleId}`);

    return newCertificate;
  } catch (error) {
    console.error('Error auto-generating certificate:', error);
    // Don't throw - certificate generation shouldn't fail the main request
    return null;
  }
}
