import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, courseEnrollments, learningModules, eq, and } from '@/lib/db';

// GET /api/enrollments - Get user's enrolled courses
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

    // Get enrolled courses with module details
    const enrollments = await database.query.courseEnrollments.findMany({
      where: eq(courseEnrollments.userId, user.id),
      with: {
        module: true,
      },
      orderBy: (e, { desc }) => [desc(e.enrolledAt)],
    });

    return NextResponse.json({
      enrollments: enrollments.map(e => ({
        id: e.id,
        moduleId: e.module.id,
        moduleSlug: e.module.moduleId,
        title: e.module.title,
        description: e.module.description,
        thumbnailUrl: e.module.thumbnailUrl,
        duration: e.module.duration,
        difficultyLevel: e.module.difficultyLevel,
        discipline: e.module.discipline,
        enrolledAt: e.enrolledAt,
        status: e.status,
      })),
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
        enrollment: existingEnrollment,
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
