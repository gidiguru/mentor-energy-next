import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorApplications, eq } from '@/lib/db';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH - Review application (approve/reject)
export async function PATCH(request: NextRequest, { params }: Props) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, reviewNotes } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const database = db();

    // Check if user is admin
    const adminUser = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get application
    const application = await database.query.mentorApplications.findFirst({
      where: eq(mentorApplications.id, id),
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Application already reviewed' }, { status: 400 });
    }

    // Update application
    const [updated] = await database
      .update(mentorApplications)
      .set({
        status,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(mentorApplications.id, id))
      .returning();

    // If approved, create mentor profile and update user role
    if (status === 'approved') {
      // Create mentor profile
      await database.insert(mentors).values({
        userId: application.userId,
        bio: application.bio,
        expertise: application.expertise,
        yearsExperience: application.yearsExperience,
        currentRole: application.currentRole,
        company: application.company,
        isVerified: true,
        isAvailable: true,
      });

      // Update user role to mentor
      await database
        .update(users)
        .set({
          role: 'mentor',
          linkedinUrl: application.linkedinUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, application.userId));
    }

    return NextResponse.json({
      success: true,
      application: {
        id: updated.id,
        status: updated.status,
        reviewedAt: updated.reviewedAt,
      },
    });
  } catch (error) {
    console.error('Error reviewing application:', error);
    return NextResponse.json({ error: 'Failed to review application' }, { status: 500 });
  }
}
