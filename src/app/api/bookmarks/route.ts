import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, bookmarks, sectionPages, moduleSections, learningModules, eq, and } from '@/lib/db';

// GET /api/bookmarks - Get user's bookmarks
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (pageId) {
      // Check if specific page is bookmarked
      const bookmark = await database.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.userId, user.id),
          eq(bookmarks.pageId, pageId),
        ),
      });
      return NextResponse.json({ isBookmarked: !!bookmark, bookmark });
    }

    // Get all bookmarks with page info
    const userBookmarks = await database.query.bookmarks.findMany({
      where: eq(bookmarks.userId, user.id),
      with: {
        page: {
          with: {
            section: {
              with: {
                module: true,
              },
            },
          },
        },
      },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    return NextResponse.json({ bookmarks: userBookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

// POST /api/bookmarks - Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already bookmarked
    const existing = await database.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, user.id),
        eq(bookmarks.pageId, pageId),
      ),
    });

    if (existing) {
      return NextResponse.json({ bookmark: existing, message: 'Already bookmarked' });
    }

    // Create bookmark
    const [bookmark] = await database.insert(bookmarks).values({
      userId: user.id,
      pageId,
    }).returning();

    return NextResponse.json({ bookmark, message: 'Bookmark added' });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 });
  }
}

// DELETE /api/bookmarks - Remove a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await database.delete(bookmarks).where(
      and(
        eq(bookmarks.userId, user.id),
        eq(bookmarks.pageId, pageId),
      ),
    );

    return NextResponse.json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
  }
}
