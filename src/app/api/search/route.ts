import { NextRequest, NextResponse } from 'next/server';
import { db, learningModules, moduleSections, sectionPages, eq, ilike, or } from '@/lib/db';

// GET /api/search - Search modules and lessons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const database = db();
    const searchPattern = `%${query}%`;

    // Search modules
    const modules = await database.query.learningModules.findMany({
      where: or(
        ilike(learningModules.title, searchPattern),
        ilike(learningModules.description, searchPattern),
      ),
      limit,
    });

    // Search sections
    const sections = await database.query.moduleSections.findMany({
      where: or(
        ilike(moduleSections.title, searchPattern),
        ilike(moduleSections.description, searchPattern),
      ),
      with: {
        module: true,
      },
      limit,
    });

    // Search pages/lessons
    const pages = await database.query.sectionPages.findMany({
      where: or(
        ilike(sectionPages.title, searchPattern),
        ilike(sectionPages.content, searchPattern),
      ),
      with: {
        section: {
          with: {
            module: true,
          },
        },
      },
      limit,
    });

    // Format results
    const results = [
      ...modules.map(m => ({
        type: 'module' as const,
        id: m.id,
        title: m.title,
        description: m.description,
        url: `/learn/${m.moduleId}`,
        moduleId: m.moduleId,
        moduleName: m.title,
      })),
      ...sections.map(s => ({
        type: 'section' as const,
        id: s.id,
        title: s.title,
        description: s.description,
        url: `/learn/${s.module.moduleId}`,
        moduleId: s.module.moduleId,
        moduleName: s.module.title,
      })),
      ...pages.map(p => ({
        type: 'lesson' as const,
        id: p.id,
        title: p.title,
        description: p.content?.substring(0, 150) + (p.content && p.content.length > 150 ? '...' : ''),
        url: `/learn/${p.section.module.moduleId}/${p.section.id}/${p.id}`,
        moduleId: p.section.module.moduleId,
        moduleName: p.section.module.title,
        sectionName: p.section.title,
        pageType: p.pageType,
      })),
    ];

    // Sort by relevance (exact title match first, then by type)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;

      const typeOrder = { module: 0, section: 1, lesson: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      query,
      totalResults: results.length,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
