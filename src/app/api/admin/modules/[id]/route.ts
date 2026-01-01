import { NextRequest, NextResponse } from 'next/server';
import { db, learningModules, eq } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

interface Props {
  params: Promise<{ id: string }>;
}

// GET single module (admin only)
export async function GET(request: NextRequest, { params }: Props) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const database = db();
    const moduleData = await database.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
      with: {
        sections: {
          orderBy: (s, { asc }) => [asc(s.sequence)],
          with: {
            pages: {
              orderBy: (p, { asc }) => [asc(p.sequence)],
            },
          },
        },
      },
    });

    if (!moduleData) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({ module: moduleData });
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}

// PUT update module (admin only)
export async function PUT(request: NextRequest, { params }: Props) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      moduleId,
      title,
      description,
      duration,
      discipline,
      difficultyLevel,
      status,
      thumbnailUrl,
      learningObjectives,
    } = body;

    const database = db();

    // Check if module exists
    const existing = await database.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Update the module
    const [updated] = await database
      .update(learningModules)
      .set({
        moduleId: moduleId || existing.moduleId,
        title: title || existing.title,
        description: description ?? existing.description,
        duration: duration ?? existing.duration,
        discipline: discipline ?? existing.discipline,
        difficultyLevel: difficultyLevel ?? existing.difficultyLevel,
        status: status || existing.status,
        thumbnailUrl: thumbnailUrl ?? existing.thumbnailUrl,
        learningObjectives: learningObjectives ?? existing.learningObjectives,
        updatedAt: new Date(),
      })
      .where(eq(learningModules.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      module: updated,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    );
  }
}

// DELETE module (admin only)
export async function DELETE(request: NextRequest, { params }: Props) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const database = db();

    // Check if module exists
    const existing = await database.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Delete the module (cascades to sections and pages)
    await database.delete(learningModules).where(eq(learningModules.id, id));

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}
