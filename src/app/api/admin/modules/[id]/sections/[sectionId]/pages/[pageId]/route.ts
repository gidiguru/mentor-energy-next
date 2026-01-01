import { NextRequest, NextResponse } from 'next/server';
import { db, sectionPages, mediaContent, eq } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

interface Props {
  params: Promise<{ id: string; sectionId: string; pageId: string }>;
}

// GET a page (admin only)
export async function GET(request: NextRequest, { params }: Props) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { pageId } = await params;

  try {
    const database = db();

    const page = await database.query.sectionPages.findFirst({
      where: eq(sectionPages.id, pageId),
      with: {
        media: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Get video URL from media if exists
    const videoMedia = page.media?.find(m => m.type === 'video');

    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title,
        content: page.content,
        pageType: page.pageType,
        estimatedDuration: page.estimatedDuration,
        videoUrl: videoMedia?.url || null,
        labConfig: page.labConfig || null,
      },
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PUT update a page (admin only)
export async function PUT(request: NextRequest, { params }: Props) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { pageId } = await params;

  try {
    const body = await request.json();
    const { title, content, pageType, estimatedDuration, videoUrl, labConfig } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const database = db();

    // Check page exists
    const existingPage = await database.query.sectionPages.findFirst({
      where: eq(sectionPages.id, pageId),
      with: {
        media: true,
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Update the page
    const [updatedPage] = await database
      .update(sectionPages)
      .set({
        title,
        content: content || null,
        pageType: pageType || 'lesson',
        estimatedDuration: estimatedDuration || null,
        labConfig: pageType === 'lab' ? labConfig : null,
        updatedAt: new Date(),
      })
      .where(eq(sectionPages.id, pageId))
      .returning();

    // Handle video media
    const existingVideo = existingPage.media?.find(m => m.type === 'video');

    if (videoUrl) {
      if (existingVideo) {
        // Update existing video
        await database
          .update(mediaContent)
          .set({ url: videoUrl, title: `Video: ${title}` })
          .where(eq(mediaContent.id, existingVideo.id));
      } else {
        // Create new video media
        await database.insert(mediaContent).values({
          pageId: pageId,
          type: 'video',
          url: videoUrl,
          title: `Video: ${title}`,
          sequence: 0,
        });
      }
    } else if (existingVideo && !videoUrl) {
      // Remove video if URL is cleared
      await database.delete(mediaContent).where(eq(mediaContent.id, existingVideo.id));
    }

    return NextResponse.json({
      success: true,
      page: updatedPage,
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE a page (admin only)
export async function DELETE(request: NextRequest, { params }: Props) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { pageId } = await params;

  try {
    const database = db();

    // Check page exists
    const page = await database.query.sectionPages.findFirst({
      where: eq(sectionPages.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Delete the page (cascades to media content)
    await database.delete(sectionPages).where(eq(sectionPages.id, pageId));

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
