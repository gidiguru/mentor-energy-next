import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, sectionPages, eq } from '@/lib/db';

interface Props {
  params: Promise<{ id: string; sectionId: string; pageId: string }>;
}

// DELETE a page
export async function DELETE(request: NextRequest, { params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
