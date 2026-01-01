import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentorApplications, eq } from '@/lib/db';
import { sendMentorApplicationSubmittedEmail, sendAdminNewMentorApplicationEmail } from '@/lib/email';

// GET - Check application status
export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a mentor
    if (user.role === 'mentor') {
      return NextResponse.json({ status: 'approved', isMentor: true });
    }

    // Check for existing application
    const application = await database.query.mentorApplications.findFirst({
      where: eq(mentorApplications.userId, user.id),
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
    });

    if (!application) {
      return NextResponse.json({ status: 'none', isMentor: false });
    }

    return NextResponse.json({
      status: application.status,
      isMentor: false,
      application: {
        id: application.id,
        createdAt: application.createdAt,
        reviewedAt: application.reviewedAt,
        reviewNotes: application.status === 'rejected' ? application.reviewNotes : null,
      },
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

// POST - Submit mentor application
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bio, expertise, yearsExperience, currentRole, company, linkedinUrl, motivation, availability } = body;

    // Validate required fields
    if (!bio || !expertise || !yearsExperience || !currentRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(expertise) || expertise.length === 0) {
      return NextResponse.json({ error: 'At least one area of expertise is required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a mentor
    if (user.role === 'mentor') {
      return NextResponse.json({ error: 'You are already a mentor' }, { status: 400 });
    }

    // Check for pending application
    const existingApplication = await database.query.mentorApplications.findFirst({
      where: eq(mentorApplications.userId, user.id),
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
    });

    if (existingApplication?.status === 'pending') {
      return NextResponse.json({ error: 'You already have a pending application' }, { status: 400 });
    }

    // Create application
    const [application] = await database
      .insert(mentorApplications)
      .values({
        userId: user.id,
        bio,
        expertise,
        yearsExperience,
        currentRole,
        company: company || null,
        linkedinUrl: linkedinUrl || null,
        motivation: motivation || null,
        availability: availability || null,
      })
      .returning();

    // Send confirmation email to applicant
    if (user.email) {
      await sendMentorApplicationSubmittedEmail({
        to: user.email,
        userName: user.firstName || user.email,
        expertise,
      });
    }

    // Send notification email to admin
    await sendAdminNewMentorApplicationEmail({
      applicantName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
      applicantEmail: user.email,
      expertise,
      yearsExperience,
      currentRole,
    });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
