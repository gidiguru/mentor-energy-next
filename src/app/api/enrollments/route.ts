import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, courseEnrollments, learningModules, moduleSections, sectionPages, userPageProgress, eq, and, inArray } from '@/lib/db';
import { sendEnrollmentEmail } from '@/lib/email';

// GET /api/enrollments - Get user's enrolled courses with progress
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrolled courses with module details and sections/pages
    const enrollments = await database.query.courseEnrollments.findMany({
      where: eq(courseEnrollments.userId, user.id),
      with: {
        module: {
          with: {
            sections: {
              orderBy: (sections, { asc }) => [asc(sections.sequence)],
              with: {
                pages: {
                  orderBy: (pages, { asc }) => [asc(pages.sequence)],
                },
              },
            },
          },
        },
      },
      orderBy: (e, { desc }) => [desc(e.enrolledAt)],
    });

    // Get all page IDs across all enrolled modules
    const allPageIds: string[] = [];
    for (const enrollment of enrollments) {
      for (const section of enrollment.module.sections) {
        for (const page of section.pages) {
          allPageIds.push(page.id);
        }
      }
    }

    // Fetch user progress for all pages
    let userProgressMap: Record<string, { isCompleted: boolean; isViewed: boolean }> = {};
    if (allPageIds.length > 0) {
      const progress = await database.query.userPageProgress.findMany({
        where: and(
          eq(userPageProgress.userId, user.id),
          inArray(userPageProgress.pageId, allPageIds)
        ),
      });

      for (const p of progress) {
        userProgressMap[p.pageId] = {
          isCompleted: p.isCompleted,
          isViewed: p.isViewed,
        };
      }
    }

    // Build response with progress data
    const enrollmentsWithProgress = enrollments.map(e => {
      const module = e.module;

      // Get all pages for this module
      const modulePages: { id: string; sectionId: string }[] = [];
      for (const section of module.sections) {
        for (const page of section.pages) {
          modulePages.push({ id: page.id, sectionId: section.id });
        }
      }

      // Calculate progress
      const totalLessons = modulePages.length;
      let completedLessons = 0;
      let nextLessonLink: string | null = null;

      for (const page of modulePages) {
        const pageProgress = userProgressMap[page.id];
        if (pageProgress?.isCompleted) {
          completedLessons++;
        } else if (!nextLessonLink) {
          // First incomplete lesson is the next one
          nextLessonLink = `/learn/${module.moduleId}/${page.sectionId}/${page.id}`;
        }
      }

      // If all completed, link to first lesson for review
      if (!nextLessonLink && modulePages.length > 0) {
        const firstPage = modulePages[0];
        nextLessonLink = `/learn/${module.moduleId}/${firstPage.sectionId}/${firstPage.id}`;
      }

      const progress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      return {
        id: e.id,
        moduleId: module.id,
        moduleSlug: module.moduleId,
        title: module.title,
        description: module.description,
        thumbnailUrl: module.thumbnailUrl,
        duration: module.duration,
        difficultyLevel: module.difficultyLevel,
        discipline: module.discipline,
        enrolledAt: e.enrolledAt,
        status: e.status,
        // Progress data
        progress,
        totalLessons,
        completedLessons,
        nextLessonLink,
      };
    });

    return NextResponse.json({
      enrollments: enrollmentsWithProgress,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// POST /api/enrollments - Enroll in a course
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await request.json();

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get module (can be by UUID or moduleId slug)
    let module = await database.query.learningModules.findFirst({
      where: eq(learningModules.id, moduleId),
    });

    if (!module) {
      // Try by moduleId slug
      module = await database.query.learningModules.findFirst({
        where: eq(learningModules.moduleId, moduleId),
      });
    }

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await database.query.courseEnrollments.findFirst({
      where: and(
        eq(courseEnrollments.userId, user.id),
        eq(courseEnrollments.moduleId, module.id)
      ),
    });

    if (existingEnrollment) {
      return NextResponse.json({
        message: 'Already enrolled',
        enrollment: {
          ...existingEnrollment,
          moduleId: module.id,
        },
      });
    }

    // Create enrollment
    const [enrollment] = await database
      .insert(courseEnrollments)
      .values({
        userId: user.id,
        moduleId: module.id,
      })
      .returning();

    // Send enrollment confirmation email (don't await - send in background)
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Learner';
    sendEnrollmentEmail({
      to: user.email,
      userName,
      courseTitle: module.title,
      courseDescription: module.description || undefined,
      moduleId: module.moduleId,
    }).catch(err => console.error('Error sending enrollment email:', err));

    return NextResponse.json({
      message: 'Enrolled successfully',
      enrollment: {
        id: enrollment.id,
        moduleId: module.id,
        moduleSlug: module.moduleId,
        title: module.title,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling:', error);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}

// DELETE /api/enrollments - Unenroll from a course
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get module
    let module = await database.query.learningModules.findFirst({
      where: eq(learningModules.id, moduleId),
    });

    if (!module) {
      module = await database.query.learningModules.findFirst({
        where: eq(learningModules.moduleId, moduleId),
      });
    }

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Delete enrollment
    await database
      .delete(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, user.id),
        eq(courseEnrollments.moduleId, module.id)
      ));

    return NextResponse.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Error unenrolling:', error);
    return NextResponse.json({ error: 'Failed to unenroll' }, { status: 500 });
  }
}
