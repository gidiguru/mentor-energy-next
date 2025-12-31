import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentorApplications, eq, desc } from '@/lib/db';

// GET - List all mentor applications (admin only)
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const database = db();

    // Check if user is admin
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get applications with user info
    const applications = await database
      .select({
        id: mentorApplications.id,
        bio: mentorApplications.bio,
        expertise: mentorApplications.expertise,
        yearsExperience: mentorApplications.yearsExperience,
        currentRole: mentorApplications.currentRole,
        company: mentorApplications.company,
        linkedinUrl: mentorApplications.linkedinUrl,
        motivation: mentorApplications.motivation,
        availability: mentorApplications.availability,
        status: mentorApplications.status,
        reviewNotes: mentorApplications.reviewNotes,
        createdAt: mentorApplications.createdAt,
        reviewedAt: mentorApplications.reviewedAt,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profilePicture: users.profilePicture,
      })
      .from(mentorApplications)
      .innerJoin(users, eq(mentorApplications.userId, users.id))
      .orderBy(desc(mentorApplications.createdAt));

    // Filter by status if provided
    const filtered = status
      ? applications.filter(a => a.status === status)
      : applications;

    return NextResponse.json({
      applications: filtered.map(a => ({
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
        reviewedAt: a.reviewedAt,
        reviewNotes: a.reviewNotes,
        bio: a.bio,
        expertise: a.expertise,
        yearsExperience: a.yearsExperience,
        currentRole: a.currentRole,
        company: a.company,
        linkedinUrl: a.linkedinUrl,
        motivation: a.motivation,
        availability: a.availability,
        user: {
          id: a.userId,
          name: `${a.firstName || ''} ${a.lastName || ''}`.trim(),
          email: a.email,
          profilePicture: a.profilePicture,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
