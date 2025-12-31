import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, sectionPages, moduleSections, mediaContent, eq } from '@/lib/db';

interface Props {
  params: Promise<{ id: string; sectionId: string }>;
}

// POST create new page
export async function POST(request: NextRequest, { params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sectionId } = await params;

  try {
    const body = await request.json();
    const { title, content, pageType, estimatedDuration, videoUrl, labConfig } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const database = db();

    // Check section exists
    const section = await database.query.moduleSections.findFirst({
      where: eq(moduleSections.id, sectionId),
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Get next sequence number
    const existingPages = await database.query.sectionPages.findMany({
      where: eq(sectionPages.sectionId, sectionId),
    });
    const sequence = existingPages.length;

    // Create the page
    const [newPage] = await database
      .insert(sectionPages)
      .values({
        sectionId,
        title,
        content: content || null,
        pageType: pageType || 'lesson',
        estimatedDuration: estimatedDuration || null,
        labConfig: pageType === 'lab' ? labConfig : null,
        sequence,
      })
      .returning();

    // If video URL provided, create media content entry
    if (videoUrl) {
      await database.insert(mediaContent).values({
        pageId: newPage.id,
        type: 'video',
        url: videoUrl,
        title: `Video: ${title}`,
        sequence: 0,
      });
    }

    return NextResponse.json({
      success: true,
      page: newPage,
    });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
