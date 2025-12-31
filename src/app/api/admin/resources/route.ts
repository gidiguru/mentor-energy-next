import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, resources, eq } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List all resources
export async function GET() {
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

    const allResources = await database.query.resources.findMany({
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      with: {
        author: true,
      },
    });

    return NextResponse.json(allResources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new resource
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, description, type, category, url, content, thumbnailUrl, isPremium, isPublished } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const [newResource] = await database.insert(resources).values({
      title,
      description: description || null,
      type,
      category: category || null,
      url: url || null,
      content: content || null,
      thumbnailUrl: thumbnailUrl || null,
      isPremium: isPremium || false,
      isPublished: isPublished || false,
      authorId: user.id,
    }).returning();

    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
