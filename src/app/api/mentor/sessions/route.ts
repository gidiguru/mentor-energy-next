import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorConnections, mentorshipSessions, eq, and, or, desc } from '@/lib/db';
import { sendSessionBookedEmail } from '@/lib/email';
import { createDailyRoom, generateRoomName } from '@/lib/daily';

// GET - List sessions for current user
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

    // Get sessions as student
    const studentSessions = await database
      .select({
        id: mentorshipSessions.id,
        scheduledAt: mentorshipSessions.scheduledAt,
        durationMinutes: mentorshipSessions.durationMinutes,
        status: mentorshipSessions.status,
        topic: mentorshipSessions.topic,
        meetingUrl: mentorshipSessions.meetingUrl,
        notes: mentorshipSessions.notes,
        mentorFeedback: mentorshipSessions.mentorFeedback,
        rating: mentorshipSessions.rating,
        createdAt: mentorshipSessions.createdAt,
        mentorId: mentors.id,
        mentorFirstName: users.firstName,
        mentorLastName: users.lastName,
        mentorPicture: users.profilePicture,
        mentorRole: mentors.currentRole,
      })
      .from(mentorshipSessions)
      .innerJoin(mentors, eq(mentorshipSessions.mentorId, mentors.id))
      .innerJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentorshipSessions.studentId, user.id))
      .orderBy(desc(mentorshipSessions.scheduledAt));

    // Get sessions as mentor
    let mentorSessions: {
      id: string;
      scheduledAt: Date;
      durationMinutes: number;
      status: string;
      topic: string | null;
      meetingUrl: string | null;
      notes: string | null;
      studentNotes: string | null;
      createdAt: Date;
      studentId: string;
      studentFirstName: string | null;
      studentLastName: string | null;
      studentPicture: string | null;
      studentDiscipline: string | null;
    }[] = [];

    if (user.mentor) {
      mentorSessions = await database
        .select({
          id: mentorshipSessions.id,
          scheduledAt: mentorshipSessions.scheduledAt,
          durationMinutes: mentorshipSessions.durationMinutes,
          status: mentorshipSessions.status,
          topic: mentorshipSessions.topic,
          meetingUrl: mentorshipSessions.meetingUrl,
          notes: mentorshipSessions.notes,
          studentNotes: mentorshipSessions.studentNotes,
          createdAt: mentorshipSessions.createdAt,
          studentId: users.id,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          studentPicture: users.profilePicture,
          studentDiscipline: users.discipline,
        })
        .from(mentorshipSessions)
        .innerJoin(users, eq(mentorshipSessions.studentId, users.id))
        .where(eq(mentorshipSessions.mentorId, user.mentor.id))
        .orderBy(desc(mentorshipSessions.scheduledAt));
    }

    return NextResponse.json({
      asStudent: studentSessions.map(s => ({
        id: s.id,
        scheduledAt: s.scheduledAt,
        durationMinutes: s.durationMinutes,
        status: s.status,
        topic: s.topic,
        meetingUrl: s.meetingUrl,
        notes: s.notes,
        mentorFeedback: s.mentorFeedback,
        rating: s.rating,
        mentor: {
          id: s.mentorId,
          name: `${s.mentorFirstName || ''} ${s.mentorLastName || ''}`.trim(),
          profilePicture: s.mentorPicture,
          currentRole: s.mentorRole,
        },
      })),
      asMentor: mentorSessions.map(s => ({
        id: s.id,
        scheduledAt: s.scheduledAt,
        durationMinutes: s.durationMinutes,
        status: s.status,
        topic: s.topic,
        meetingUrl: s.meetingUrl,
        notes: s.notes,
        studentNotes: s.studentNotes,
        student: {
          id: s.studentId,
          name: `${s.studentFirstName || ''} ${s.studentLastName || ''}`.trim(),
          profilePicture: s.studentPicture,
          discipline: s.studentDiscipline,
        },
      })),
      isMentor: !!user.mentor,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST - Book a session with a mentor
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mentorId, scheduledAt, durationMinutes, topic } = body;

    if (!mentorId || !scheduledAt) {
      return NextResponse.json({ error: 'Mentor ID and scheduled time are required' }, { status: 400 });
    }

    const database = db();

    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check mentor exists
    const mentor = await database.query.mentors.findFirst({
      where: eq(mentors.id, mentorId),
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Check for active connection
    const connection = await database.query.mentorConnections.findFirst({
      where: and(
        eq(mentorConnections.mentorId, mentorId),
        eq(mentorConnections.studentId, user.id),
        eq(mentorConnections.status, 'accepted')
      ),
    });

    if (!connection) {
      return NextResponse.json({ error: 'You must be connected with this mentor to book a session' }, { status: 403 });
    }

    // Create session
    const [session] = await database
      .insert(mentorshipSessions)
      .values({
        mentorId,
        studentId: user.id,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 60,
        topic: topic || null,
      })
      .returning();

    // Create Daily.co video room for the session
    const sessionDate = new Date(scheduledAt);
    const roomExpiryTime = Math.floor(sessionDate.getTime() / 1000) + (24 * 60 * 60); // 24 hours after session
    const roomName = generateRoomName(session.id);

    const dailyRoom = await createDailyRoom({
      name: roomName,
      expiryTime: roomExpiryTime,
      maxParticipants: 2,
    });

    // Update session with meeting URL if room was created
    let meetingUrl: string | null = null;
    if (dailyRoom) {
      meetingUrl = dailyRoom.url;
      await database
        .update(mentorshipSessions)
        .set({ meetingUrl })
        .where(eq(mentorshipSessions.id, session.id));
    }

    // Get mentor user info for email
    const mentorUser = await database.query.users.findFirst({
      where: eq(users.id, mentor.userId),
    });

    const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Mentee';
    const mentorName = `${mentorUser?.firstName || ''} ${mentorUser?.lastName || ''}`.trim() || 'Mentor';

    // Send email to student
    if (user.email) {
      await sendSessionBookedEmail({
        to: user.email,
        recipientName: studentName,
        otherPartyName: mentorName,
        isForMentor: false,
        sessionDate,
        sessionTopic: topic,
        meetingUrl: meetingUrl || undefined,
      });
    }

    // Send email to mentor
    if (mentorUser?.email) {
      await sendSessionBookedEmail({
        to: mentorUser.email,
        recipientName: mentorName,
        otherPartyName: studentName,
        isForMentor: true,
        sessionDate,
        sessionTopic: topic,
        meetingUrl: meetingUrl || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
        status: session.status,
        meetingUrl,
      },
    });
  } catch (error) {
    console.error('Error booking session:', error);
    return NextResponse.json({ error: 'Failed to book session' }, { status: 500 });
  }
}
