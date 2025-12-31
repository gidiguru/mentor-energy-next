import { NextResponse } from 'next/server';
import { db, learningModules, eq } from '@/lib/db';

// GET /api/modules - Get all published modules
export async function GET() {
  try {
    const database = db();

    const modules = await database.query.learningModules.findMany({
      where: eq(learningModules.status, 'published'),
      orderBy: (modules, { asc }) => [asc(modules.orderIndex)],
    });

    return NextResponse.json({
      modules: modules.map(m => ({
        id: m.id,
        moduleId: m.moduleId,
        title: m.title,
        description: m.description,
        thumbnailUrl: m.thumbnailUrl,
        duration: m.duration,
        difficultyLevel: m.difficultyLevel,
        discipline: m.discipline,
        learningObjectives: m.learningObjectives,
        prerequisites: m.prerequisites,
        skillsGained: m.skillsGained,
      })),
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}
