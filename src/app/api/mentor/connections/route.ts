import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorConnections, eq, and } from '@/lib/db';
import { sendConnectionRequestEmail } from '@/lib/email';

// GET - List connections for current user (as student or mentor)
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
      with: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get connections as student
    const studentConnections = await database
      .select({
        id: mentorConnections.id,
        status: mentorConnections.status,
        message: mentorConnections.message,
        mentorResponse: mentorConnections.mentorResponse,
        createdAt: mentorConnections.createdAt,
        mentorId: mentors.id,
        mentorUserId: mentors.userId,
        mentorBio: mentors.bio,
        mentorExpertise: mentors.expertise,
        mentorRole: mentors.currentRole,
        mentorCompany: mentors.company,
        mentorFirstName: users.firstName,
        mentorLastName: users.lastName,
        mentorPicture: users.profilePicture,
      })
      .from(mentorConnections)
      .innerJoin(mentors, eq(mentorConnections.mentorId, mentors.id))
      .innerJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentorConnections.studentId, user.id));

    // Get connections as mentor (if user is a mentor)
    let mentorConnectionsList: {
      id: string;
      status: string;
      message: string | null;
      mentorResponse: string | null;
      createdAt: Date;
      studentId: string;
      studentFirstName: string | null;
      studentLastName: string | null;
      studentPicture: string | null;
      studentDiscipline: string | null;
      studentBio: string | null;
    }[] = [];

    if (user.mentor) {
      mentorConnectionsList = await database
        .select({
          id: mentorConnections.id,
          status: mentorConnections.status,
          message: mentorConnections.message,
          mentorResponse: mentorConnections.mentorResponse,
          createdAt: mentorConnections.createdAt,
          studentId: mentorConnections.studentId,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          studentPicture: users.profilePicture,
          studentDiscipline: users.discipline,
          studentBio: users.bio,
        })
        .from(mentorConnections)
        .innerJoin(users, eq(mentorConnections.studentId, users.id))
        .where(eq(mentorConnections.mentorId, user.mentor.id));
    }

    return NextResponse.json({
      asStudent: studentConnections.map(c => ({
        id: c.id,
        status: c.status,
        message: c.message,
        mentorResponse: c.mentorResponse,
        createdAt: c.createdAt,
        mentor: {
          id: c.mentorId,
          userId: c.mentorUserId,
          name: `${c.mentorFirstName || ''} ${c.mentorLastName || ''}`.trim(),
          profilePicture: c.mentorPicture,
          bio: c.mentorBio,
          expertise: c.mentorExpertise,
          currentRole: c.mentorRole,
          company: c.mentorCompany,
        },
      })),
      asMentor: mentorConnectionsList.map(c => ({
        id: c.id,
        status: c.status,
        message: c.message,
        mentorResponse: c.mentorResponse,
        createdAt: c.createdAt,
        student: {
          id: c.studentId,
          name: `${c.studentFirstName || ''} ${c.studentLastName || ''}`.trim(),
          profilePicture: c.studentPicture,
          discipline: c.studentDiscipline,
          bio: c.studentBio,
        },
      })),
      isMentor: !!user.mentor,
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

// POST - Send connection request to a mentor
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mentorId, message } = body;

    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check mentor exists and is available
    const mentor = await database.query.mentors.findFirst({
      where: and(
        eq(mentors.id, mentorId),
        eq(mentors.isVerified, true),
        eq(mentors.isAvailable, true)
      ),
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found or unavailable' }, { status: 404 });
    }

    // Check if not requesting self
    if (mentor.userId === user.id) {
      return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 });
    }

    // Check for existing connection
    const existing = await database.query.mentorConnections.findFirst({
      where: and(
        eq(mentorConnections.mentorId, mentorId),
        eq(mentorConnections.studentId, user.id)
      ),
    });

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'Connection request already pending' }, { status: 400 });
      }
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Already connected with this mentor' }, { status: 400 });
      }
    }

    // Create connection request
    const [connection] = await database
      .insert(mentorConnections)
      .values({
        mentorId,
        studentId: user.id,
        message: message || null,
      })
      .onConflictDoUpdate({
        target: [mentorConnections.mentorId, mentorConnections.studentId],
        set: {
          status: 'pending',
          message: message || null,
          mentorResponse: null,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Get mentor's user info for email
    const mentorUser = await database.query.users.findFirst({
      where: eq(users.id, mentor.userId),
    });

    // Send email to mentor
    if (mentorUser?.email) {
      const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const mentorName = `${mentorUser.firstName || ''} ${mentorUser.lastName || ''}`.trim() || 'Mentor';

      await sendConnectionRequestEmail({
        to: mentorUser.email,
        mentorName,
        studentName,
        studentMessage: message,
      });
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        status: connection.status,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to send connection request' }, { status: 500 });
  }
}
