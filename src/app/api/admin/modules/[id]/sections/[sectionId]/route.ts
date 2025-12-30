import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, moduleSections, eq } from '@/lib/db';

interface Props {
  params: Promise<{ id: string; sectionId: string }>;
}

// DELETE a section
export async function DELETE(request: NextRequest, { params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sectionId } = await params;

  try {
    const database = db();

    // Check section exists
    const section = await database.query.moduleSections.findFirst({
      where: eq(moduleSections.id, sectionId),
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Delete the section (cascades to pages and media)
    await database.delete(moduleSections).where(eq(moduleSections.id, sectionId));

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
