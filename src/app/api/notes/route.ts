import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, lessonNotes, eq, and } from '@/lib/db';

// GET /api/notes - Get user's notes
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
      // Get note for specific page
      const note = await database.query.lessonNotes.findFirst({
        where: and(
          eq(lessonNotes.userId, user.id),
          eq(lessonNotes.pageId, pageId),
        ),
      });
      return NextResponse.json({ note });
    }

    // Get all user's notes with page info
    const userNotes = await database.query.lessonNotes.findMany({
      where: eq(lessonNotes.userId, user.id),
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
      orderBy: (n, { desc }) => [desc(n.updatedAt)],
    });

    return NextResponse.json({ notes: userNotes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes - Create or update a note
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, content } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for existing note
    const existing = await database.query.lessonNotes.findFirst({
      where: and(
        eq(lessonNotes.userId, user.id),
        eq(lessonNotes.pageId, pageId),
      ),
    });

    let note;
    if (existing) {
      // Update existing note
      [note] = await database.update(lessonNotes)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(eq(lessonNotes.id, existing.id))
        .returning();
    } else {
      // Create new note
      [note] = await database.insert(lessonNotes).values({
        userId: user.id,
        pageId,
        content,
      }).returning();
    }

    return NextResponse.json({ note, message: existing ? 'Note updated' : 'Note created' });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

// DELETE /api/notes - Delete a note
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

    await database.delete(lessonNotes).where(
      and(
        eq(lessonNotes.userId, user.id),
        eq(lessonNotes.pageId, pageId),
      ),
    );

    return NextResponse.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
