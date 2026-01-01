import { NextRequest, NextResponse } from 'next/server';
import { db, moduleSections, learningModules, eq } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

interface Props {
  params: Promise<{ id: string }>;
}

// POST create new section (admin only)
export async function POST(request: NextRequest, { params }: Props) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: moduleId } = await params;

  try {
    const body = await request.json();
    const { title, description, estimatedDuration } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const database = db();

    // Check module exists
    const module = await database.query.learningModules.findFirst({
      where: eq(learningModules.id, moduleId),
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get next sequence number
    const existingSections = await database.query.moduleSections.findMany({
      where: eq(moduleSections.moduleId, moduleId),
    });
    const sequence = existingSections.length;

    // Create the section
    const [newSection] = await database
      .insert(moduleSections)
      .values({
        moduleId,
        title,
        description: description || null,
        estimatedDuration: estimatedDuration || null,
        sequence,
      })
      .returning();

    return NextResponse.json({
      success: true,
      section: newSection,
    });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
