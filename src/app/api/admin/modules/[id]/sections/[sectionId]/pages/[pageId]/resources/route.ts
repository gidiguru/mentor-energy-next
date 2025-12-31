import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mediaContent, sectionPages, eq, and } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List all resources for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string; pageId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();
    const { pageId } = await params;

    const media = await database.query.mediaContent.findMany({
      where: eq(mediaContent.pageId, pageId),
      orderBy: (m, { asc }) => [asc(m.sequence)],
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching lesson resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new resource to a lesson
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string; pageId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    // Check admin status
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { pageId } = await params;
    const body = await request.json();
    const { type, url, title, alt, metadata } = body;

    if (!type || !url) {
      return NextResponse.json({ error: 'Type and URL are required' }, { status: 400 });
    }

    // Validate page exists
    const page = await database.query.sectionPages.findFirst({
      where: eq(sectionPages.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Get max sequence for ordering
    const existingMedia = await database.query.mediaContent.findMany({
      where: eq(mediaContent.pageId, pageId),
    });
    const maxSequence = existingMedia.reduce((max, m) => Math.max(max, m.sequence), -1);

    const [newMedia] = await database.insert(mediaContent).values({
      pageId,
      type,
      url,
      title: title || null,
      alt: alt || null,
      metadata: metadata || null,
      sequence: maxSequence + 1,
    }).returning();

    return NextResponse.json(newMedia, { status: 201 });
  } catch (error) {
    console.error('Error adding lesson resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a resource from a lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string; pageId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    // Check admin status
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { pageId } = await params;
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    // Verify media belongs to this page
    const media = await database.query.mediaContent.findFirst({
      where: and(
        eq(mediaContent.id, mediaId),
        eq(mediaContent.pageId, pageId)
      ),
    });

    if (!media) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    await database.delete(mediaContent).where(eq(mediaContent.id, mediaId));

    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
