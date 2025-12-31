import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, lessonRatings, eq, and } from '@/lib/db';

// GET /api/ratings?pageId=xxx - Get rating stats and user's rating for a page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const database = db();

    // Get all ratings for this page
    const ratings = await database.query.lessonRatings.findMany({
      where: eq(lessonRatings.pageId, pageId),
    });

    // Calculate average and count
    const count = ratings.length;
    const average = count > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    // Get current user's rating if logged in
    let userRating: number | null = null;
    const { userId: clerkId } = await auth();

    if (clerkId) {
      const user = await database.query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      });

      if (user) {
        const existingRating = await database.query.lessonRatings.findFirst({
          where: and(
            eq(lessonRatings.pageId, pageId),
            eq(lessonRatings.userId, user.id),
          ),
        });
        userRating = existingRating?.rating ?? null;
      }
    }

    return NextResponse.json({
      average: Math.round(average * 10) / 10, // Round to 1 decimal
      count,
      userRating,
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}

// POST /api/ratings - Create or update a rating
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, rating } = body;

    if (!pageId || rating === undefined) {
      return NextResponse.json({ error: 'pageId and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const database = db();

    // Get user from clerk ID
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for existing rating
    const existingRating = await database.query.lessonRatings.findFirst({
      where: and(
        eq(lessonRatings.pageId, pageId),
        eq(lessonRatings.userId, user.id),
      ),
    });

    if (existingRating) {
      // Update existing rating
      await database
        .update(lessonRatings)
        .set({
          rating,
          updatedAt: new Date(),
        })
        .where(eq(lessonRatings.id, existingRating.id));
    } else {
      // Create new rating
      await database.insert(lessonRatings).values({
        pageId,
        userId: user.id,
        rating,
      });
    }

    // Get updated stats
    const ratings = await database.query.lessonRatings.findMany({
      where: eq(lessonRatings.pageId, pageId),
    });

    const count = ratings.length;
    const average = count > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    return NextResponse.json({
      success: true,
      average: Math.round(average * 10) / 10,
      count,
      userRating: rating,
    });
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
