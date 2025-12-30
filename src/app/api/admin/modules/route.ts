import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, learningModules, moduleSections, eq } from '@/lib/db';

// GET all modules
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();
    const modules = await database.query.learningModules.findMany({
      orderBy: (m, { asc }) => [asc(m.orderIndex)],
      with: {
        sections: {
          orderBy: (s, { asc }) => [asc(s.sequence)],
        },
      },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

// POST create new module
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      sections,
    } = body;

    if (!moduleId || !title) {
      return NextResponse.json(
        { error: 'moduleId and title are required' },
        { status: 400 }
      );
    }

    const database = db();

    // Check if moduleId already exists
    const existing = await database.query.learningModules.findFirst({
      where: eq(learningModules.moduleId, moduleId),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A module with this ID already exists' },
        { status: 400 }
      );
    }

    // Get the next order index
    const allModules = await database.select().from(learningModules);
    const orderIndex = allModules.length;

    // Create the module
    const [newModule] = await database
      .insert(learningModules)
      .values({
        moduleId,
        title,
        description: description || null,
        duration: duration || null,
        discipline: discipline || null,
        difficultyLevel: difficultyLevel || null,
        status: status || 'draft',
        thumbnailUrl: thumbnailUrl || null,
        learningObjectives: learningObjectives || null,
        orderIndex,
      })
      .returning();

    // Create sections if provided
    if (sections && sections.length > 0) {
      const sectionsToInsert = sections.map((section: {
        title: string;
        description?: string;
        estimatedDuration?: string;
      }, index: number) => ({
        moduleId: newModule.id,
        title: section.title,
        description: section.description || null,
        estimatedDuration: section.estimatedDuration || null,
        sequence: index,
      }));

      await database.insert(moduleSections).values(sectionsToInsert);
    }

    // Fetch the complete module with sections
    const completeModule = await database.query.learningModules.findFirst({
      where: eq(learningModules.id, newModule.id),
      with: {
        sections: {
          orderBy: (s, { asc }) => [asc(s.sequence)],
        },
      },
    });

    return NextResponse.json({
      success: true,
      module: completeModule,
    });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}
