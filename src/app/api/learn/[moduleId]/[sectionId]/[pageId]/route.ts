import { NextResponse } from 'next/server';
import { db, learningModules, moduleSections, sectionPages, mediaContent, eq, and } from '@/lib/db';

interface Props {
  params: Promise<{
    moduleId: string;
    sectionId: string;
    pageId: string;
  }>;
}

export async function GET(request: Request, { params }: Props) {
  const { moduleId, sectionId, pageId } = await params;
  const database = db();

  try {
    // Fetch module with all sections and pages
    const module = await database.query.learningModules.findFirst({
      where: eq(learningModules.moduleId, moduleId),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.sequence)],
          with: {
            pages: {
              orderBy: (pages, { asc }) => [asc(pages.sequence)],
              with: {
                media: {
                  orderBy: (media, { asc }) => [asc(media.sequence)],
                },
              },
            },
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Find current section and page
    const section = module.sections.find(s => s.id === sectionId);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const page = section.pages.find(p => p.id === pageId);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Build navigation (prev/next)
    const allPages: Array<{ sectionId: string; pageId: string; title: string }> = [];
    for (const s of module.sections) {
      for (const p of s.pages) {
        allPages.push({ sectionId: s.id, pageId: p.id, title: p.title });
      }
    }

    const currentIndex = allPages.findIndex(p => p.pageId === pageId);
    const navigation = {
      prev: currentIndex > 0 ? allPages[currentIndex - 1] : null,
      next: currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null,
    };

    return NextResponse.json({
      module: {
        id: module.id,
        moduleId: module.moduleId,
        title: module.title,
        sections: module.sections.map(s => ({
          id: s.id,
          title: s.title,
          sequence: s.sequence,
          pages: s.pages.map(p => ({
            id: p.id,
            title: p.title,
            pageType: p.pageType,
            sequence: p.sequence,
          })),
        })),
      },
      section: {
        id: section.id,
        title: section.title,
        sequence: section.sequence,
      },
      page: {
        id: page.id,
        title: page.title,
        content: page.content,
        pageType: page.pageType,
        sequence: page.sequence,
        estimatedDuration: page.estimatedDuration,
        quizQuestions: page.quizQuestions,
        media: page.media?.map(m => ({
          id: m.id,
          type: m.type,
          url: m.url,
          title: m.title,
        })) || [],
      },
      navigation,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}
