import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, userPageProgress, userModuleProgress, sectionPages, moduleSections, learningModules, eq, and } from '@/lib/db';

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
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// POST /api/progress - Mark a page as complete
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, moduleId } = body;

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
          isCompleted: true,
          isViewed: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userPageProgress.id, existingProgress.id));
    } else {
      // Insert new progress
      await database.insert(userPageProgress).values({
        userId: user.id,
        pageId: pageId,
        isCompleted: true,
        isViewed: true,
        completedAt: new Date(),
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

    return NextResponse.json({
      success: true,
      completedCount,
      totalPages,
      progressPercentage,
      isModuleCompleted,
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
