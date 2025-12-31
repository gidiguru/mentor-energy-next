import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, resources, eq } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Get single resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const resource = await database.query.resources.findFirst({
      where: eq(resources.id, id),
      with: {
        author: true,
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const { title, description, type, category, url, content, thumbnailUrl, isPremium, isPublished } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    // Check if resource exists
    const existingResource = await database.query.resources.findFirst({
      where: eq(resources.id, id),
    });

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const [updatedResource] = await database.update(resources)
      .set({
        title,
        description: description || null,
        type,
        category: category || null,
        url: url || null,
        content: content || null,
        thumbnailUrl: thumbnailUrl || null,
        isPremium: isPremium ?? false,
        isPublished: isPublished ?? false,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, id))
      .returning();

    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Check if resource exists
    const existingResource = await database.query.resources.findFirst({
      where: eq(resources.id, id),
    });

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    await database.delete(resources).where(eq(resources.id, id));

    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
