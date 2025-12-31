import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, userPageProgress, eq, and } from '@/lib/db';

// GET /api/lab-progress?pageId=xxx - Get lab progress for a page
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ progress: null });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ progress: null });
    }

    // Get page progress
    const progress = await database.query.userPageProgress.findFirst({
      where: and(
        eq(userPageProgress.userId, user.id),
        eq(userPageProgress.pageId, pageId),
      ),
    });

    // Lab progress is stored in quizAnswers field (repurposed for non-quiz pages)
    const labProgress = progress?.quizAnswers as Record<string, unknown> | null;

    return NextResponse.json({
      progress: labProgress?.labProgress || null,
      isCompleted: progress?.isCompleted ?? false,
    });
  } catch (error) {
    console.error('Error fetching lab progress:', error);
    return NextResponse.json({ progress: null });
  }
}

// POST /api/lab-progress - Save lab progress
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, progress, completed } = body;

    if (!pageId || !progress) {
      return NextResponse.json({ error: 'pageId and progress are required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create page progress
    const existingProgress = await database.query.userPageProgress.findFirst({
      where: and(
        eq(userPageProgress.userId, user.id),
        eq(userPageProgress.pageId, pageId),
      ),
    });

    // Store lab progress in quizAnswers field
    const labData = {
      labProgress: progress,
      lastUpdated: new Date().toISOString(),
    };

    if (existingProgress) {
      await database
        .update(userPageProgress)
        .set({
          quizAnswers: labData,
          isViewed: true,
          isCompleted: completed ?? existingProgress.isCompleted,
          completedAt: completed ? new Date() : existingProgress.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(userPageProgress.id, existingProgress.id));
    } else {
      await database.insert(userPageProgress).values({
        userId: user.id,
        pageId: pageId,
        quizAnswers: labData,
        isViewed: true,
        isCompleted: completed ?? false,
        completedAt: completed ? new Date() : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving lab progress:', error);
    return NextResponse.json({ error: 'Failed to save lab progress' }, { status: 500 });
  }
}
