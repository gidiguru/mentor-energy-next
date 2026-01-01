import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, mentors, eq } from '@/lib/db';

// GET - List all mentors
export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    // Check if user is admin
    const adminUser = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all mentors with user info
    const allMentors = await database.query.mentors.findMany({
      with: {
        user: true,
      },
      orderBy: (mentors, { desc }) => [desc(mentors.createdAt)],
    });

    const formattedMentors = allMentors.map((mentor) => ({
      id: mentor.id,
      userId: mentor.userId,
      bio: mentor.bio,
      expertise: mentor.expertise,
      yearsExperience: mentor.yearsExperience,
      currentRole: mentor.currentRole,
      company: mentor.company,
      isAvailable: mentor.isAvailable,
      isVerified: mentor.isVerified,
      sessionCount: mentor.sessionCount,
      averageRating: mentor.averageRating,
      createdAt: mentor.createdAt,
      user: mentor.user ? {
        id: mentor.user.id,
        name: `${mentor.user.firstName || ''} ${mentor.user.lastName || ''}`.trim() || mentor.user.email,
        email: mentor.user.email,
        profilePicture: mentor.user.profilePicture,
        role: mentor.user.role,
      } : null,
    }));

    return NextResponse.json({ mentors: formattedMentors });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
  }
}
