import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorConnections, mentorshipSessions, eq, and, or, desc, gte } from '@/lib/db';
import { sendSessionBookedEmail } from '@/lib/email';
import { createDailyRoom, generateRoomName } from '@/lib/daily';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Session limits configuration
const SESSION_LIMITS = {
  FREE_MONTHLY_SESSIONS: 4, // Max sessions per month for free users
  PREMIUM_MONTHLY_SESSIONS: 20, // Max sessions per month for premium users
  MAX_DURATION_MINUTES: 90, // Maximum session duration
  MIN_DURATION_MINUTES: 15, // Minimum session duration
  MIN_HOURS_BETWEEN_SESSIONS: 24, // Minimum hours between sessions with same mentor
  MAX_DAYS_IN_ADVANCE: 30, // Can't book more than 30 days in advance
};

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

    // ============================================
    // GUARDRAILS: Session limits and validations
    // ============================================

    const requestedDuration = durationMinutes || 60;
    const sessionDate = new Date(scheduledAt);
    const now = new Date();

    // 1. Validate duration limits
    if (requestedDuration < SESSION_LIMITS.MIN_DURATION_MINUTES) {
      return NextResponse.json({
        error: `Minimum session duration is ${SESSION_LIMITS.MIN_DURATION_MINUTES} minutes`,
      }, { status: 400 });
    }

    if (requestedDuration > SESSION_LIMITS.MAX_DURATION_MINUTES) {
      return NextResponse.json({
        error: `Maximum session duration is ${SESSION_LIMITS.MAX_DURATION_MINUTES} minutes`,
      }, { status: 400 });
    }

    // 2. Validate scheduling time (not too far in advance)
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + SESSION_LIMITS.MAX_DAYS_IN_ADVANCE);

    if (sessionDate > maxAdvanceDate) {
      return NextResponse.json({
        error: `Cannot book sessions more than ${SESSION_LIMITS.MAX_DAYS_IN_ADVANCE} days in advance`,
      }, { status: 400 });
    }

    // 3. Validate not in the past
    if (sessionDate < now) {
      return NextResponse.json({
        error: 'Cannot book sessions in the past',
      }, { status: 400 });
    }

    // 4. Check monthly session limit
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const userSessionsThisMonth = await database
      .select({ id: mentorshipSessions.id })
      .from(mentorshipSessions)
      .where(
        and(
          eq(mentorshipSessions.studentId, user.id),
          gte(mentorshipSessions.createdAt, startOfMonth),
          or(
            eq(mentorshipSessions.status, 'scheduled'),
            eq(mentorshipSessions.status, 'completed')
          )
        )
      );

    const monthlyLimit = user.subscriptionTier === 'premium'
      ? SESSION_LIMITS.PREMIUM_MONTHLY_SESSIONS
      : SESSION_LIMITS.FREE_MONTHLY_SESSIONS;

    if (userSessionsThisMonth.length >= monthlyLimit) {
      return NextResponse.json({
        error: `Monthly session limit reached (${monthlyLimit} sessions). ${user.subscriptionTier === 'free' ? 'Upgrade to premium for more sessions.' : 'Please wait until next month.'}`,
        limit: monthlyLimit,
        used: userSessionsThisMonth.length,
      }, { status: 429 });
    }

    // 5. Check cooldown with same mentor (prevent rapid booking)
    const cooldownTime = new Date();
    cooldownTime.setHours(cooldownTime.getHours() - SESSION_LIMITS.MIN_HOURS_BETWEEN_SESSIONS);

    const recentSessionWithMentor = await database
      .select({ id: mentorshipSessions.id, scheduledAt: mentorshipSessions.scheduledAt })
      .from(mentorshipSessions)
      .where(
        and(
          eq(mentorshipSessions.studentId, user.id),
          eq(mentorshipSessions.mentorId, mentorId),
          gte(mentorshipSessions.createdAt, cooldownTime),
          or(
            eq(mentorshipSessions.status, 'scheduled'),
            eq(mentorshipSessions.status, 'completed')
          )
        )
      )
      .limit(1);

    if (recentSessionWithMentor.length > 0) {
      return NextResponse.json({
        error: `Please wait ${SESSION_LIMITS.MIN_HOURS_BETWEEN_SESSIONS} hours between booking sessions with the same mentor`,
      }, { status: 429 });
    }

    // ============================================
    // END GUARDRAILS
    // ============================================

    // Create session
    const [session] = await database
      .insert(mentorshipSessions)
      .values({
        mentorId,
        studentId: user.id,
        scheduledAt: sessionDate,
        durationMinutes: requestedDuration,
        topic: topic || null,
      })
      .returning();

    // Create Daily.co video room for the session
    const roomExpiryTime = Math.floor(sessionDate.getTime() / 1000) + (requestedDuration * 60) + (2 * 60 * 60); // Session duration + 2 hours buffer
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
