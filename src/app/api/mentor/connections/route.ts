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

    // Get user with mentor relation
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMentor = user.role === 'mentor' || !!user.mentor;

    // Try to get connections - if table doesn't exist, return empty arrays
    let studentConnections: typeof mentorConnections.$inferSelect[] = [];
    let mentorConnectionsData: typeof mentorConnections.$inferSelect[] = [];

    try {
      // Get connections where user is the student
      studentConnections = await database.query.mentorConnections.findMany({
        where: eq(mentorConnections.studentId, user.id),
        with: {
          mentor: {
            with: {
              user: true,
            },
          },
        },
      });

      // Get connections where user is the mentor
      if (user.mentor) {
        mentorConnectionsData = await database.query.mentorConnections.findMany({
          where: eq(mentorConnections.mentorId, user.mentor.id),
          with: {
            student: true,
          },
        });
      }
    } catch (connectionError) {
      // Table might not exist yet - return empty arrays
      console.warn('Could not fetch connections (table may not exist):', connectionError);
    }

    return NextResponse.json({
      asStudent: studentConnections.map(c => {
        const mentorData = (c as typeof c & { mentor: { user: typeof users.$inferSelect } & typeof mentors.$inferSelect }).mentor;
        return {
          id: c.id,
          status: c.status,
          message: c.message,
          mentorResponse: c.mentorResponse,
          createdAt: c.createdAt,
          mentor: mentorData ? {
            id: mentorData.id,
            userId: mentorData.userId,
            name: `${mentorData.user?.firstName || ''} ${mentorData.user?.lastName || ''}`.trim(),
            profilePicture: mentorData.user?.profilePicture,
            bio: mentorData.bio,
            expertise: mentorData.expertise,
            currentRole: mentorData.currentRole,
            company: mentorData.company,
          } : null,
        };
      }),
      asMentor: mentorConnectionsData.map(c => {
        const studentData = (c as typeof c & { student: typeof users.$inferSelect }).student;
        return {
          id: c.id,
          status: c.status,
          message: c.message,
          mentorResponse: c.mentorResponse,
          createdAt: c.createdAt,
          student: studentData ? {
            id: studentData.id,
            name: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
            profilePicture: studentData.profilePicture,
            discipline: studentData.discipline,
            bio: studentData.bio,
          } : null,
        };
      }),
      isMentor,
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to fetch connections',
      details: errorMessage,
    }, { status: 500 });
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

    // Check mentor exists and is available, include user info for email
    const mentor = await database.query.mentors.findFirst({
      where: and(
        eq(mentors.id, mentorId),
        eq(mentors.isVerified, true),
        eq(mentors.isAvailable, true)
      ),
      with: {
        user: true,
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found or unavailable' }, { status: 404 });
    }

    const mentorUser = mentor.user;

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

    // Send email notification to mentor (don't await - send in background)
    if (mentorUser?.email) {
      const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A student';
      const mentorName = `${mentorUser.firstName || ''} ${mentorUser.lastName || ''}`.trim() || 'Mentor';

      sendConnectionRequestEmail({
        to: mentorUser.email,
        mentorName,
        studentName,
        studentMessage: message || undefined,
      }).catch(err => console.error('Error sending connection request email:', err));
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for common database errors
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return NextResponse.json({
        error: 'Database not configured. Please contact administrator.',
        details: 'mentor_connections table missing'
      }, { status: 500 });
    }

    if (errorMessage.includes('invalid input value for enum')) {
      return NextResponse.json({
        error: 'Database configuration error. Please contact administrator.',
        details: 'connection_status enum missing'
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Failed to send connection request',
      details: errorMessage
    }, { status: 500 });
  }
}
