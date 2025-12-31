import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, userPageProgress, eq, and } from '@/lib/db';

// GET /api/video-progress?pageId=xxx - Get saved video position for a page
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ position: 0 });
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
      return NextResponse.json({ position: 0 });
    }

    // Get page progress with video position from metadata
    const progress = await database.query.userPageProgress.findFirst({
      where: and(
        eq(userPageProgress.userId, user.id),
        eq(userPageProgress.pageId, pageId),
      ),
    });

    // Video position is stored in the timeSpentSeconds field as a secondary purpose
    // or we'll add a separate field. For now, let's use a metadata approach
    // by storing it in the quiz_answers jsonb field when page type isn't quiz
    const videoPosition = (progress as Record<string, unknown>)?.videoPosition ?? 0;

    return NextResponse.json({
      position: videoPosition,
      isCompleted: progress?.isCompleted ?? false,
    });
  } catch (error) {
    console.error('Error fetching video progress:', error);
    return NextResponse.json({ position: 0 });
  }
}

// POST /api/video-progress - Save video position
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, position, duration } = body;

    if (!pageId || position === undefined) {
      return NextResponse.json({ error: 'pageId and position are required' }, { status: 400 });
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

    // Store video position in quizAnswers field (repurposed for non-quiz pages)
    const videoData = {
      videoPosition: position,
      videoDuration: duration || 0,
      lastUpdated: new Date().toISOString(),
    };

    if (existingProgress) {
      await database
        .update(userPageProgress)
        .set({
          quizAnswers: videoData,
          isViewed: true,
          updatedAt: new Date(),
        })
        .where(eq(userPageProgress.id, existingProgress.id));
    } else {
      await database.insert(userPageProgress).values({
        userId: user.id,
        pageId: pageId,
        quizAnswers: videoData,
        isViewed: true,
        isCompleted: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving video progress:', error);
    return NextResponse.json({ error: 'Failed to save video progress' }, { status: 500 });
  }
}
