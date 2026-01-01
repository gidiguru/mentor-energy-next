import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, mentors, mentorshipSessions, eq } from '@/lib/db';
import { createMeetingToken, generateRoomName, createDailyRoom, getDailyRoom } from '@/lib/daily';

// GET - Get meeting token for a session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  const { id: sessionId } = await params;

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    // Get current user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get session
    const session = await database.query.mentorshipSessions.findFirst({
      where: eq(mentorshipSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is participant (either mentor or student)
    const isMentor = user.mentor && session.mentorId === user.mentor.id;
    const isStudent = session.studentId === user.id;

    if (!isMentor && !isStudent) {
      return NextResponse.json({ error: 'You are not a participant in this session' }, { status: 403 });
    }

    // Check session is scheduled
    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: 'This session is not active' }, { status: 400 });
    }

    // Check session hasn't expired (allow joining up to 2 hours after scheduled time)
    const sessionTime = new Date(session.scheduledAt).getTime();
    const now = Date.now();
    const twoHoursAfter = sessionTime + (2 * 60 * 60 * 1000);

    if (now > twoHoursAfter) {
      return NextResponse.json({ error: 'This session has expired' }, { status: 400 });
    }

    // Allow joining up to 24 hours before scheduled time (for flexibility)
    const twentyFourHoursBefore = sessionTime - (24 * 60 * 60 * 1000);
    if (now < twentyFourHoursBefore) {
      return NextResponse.json({
        error: 'Session has not started yet. You can join up to 24 hours before the scheduled time.',
        startsAt: session.scheduledAt,
      }, { status: 400 });
    }

    // Generate meeting token
    const roomName = generateRoomName(sessionId);
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Participant';

    // Check if room exists, create if it doesn't (handles sessions created before Daily integration)
    let meetingUrl = session.meetingUrl;
    console.log(`Checking for room: ${roomName}, existing meetingUrl: ${meetingUrl}`);
    console.log(`DAILY_API_KEY configured: ${!!process.env.DAILY_API_KEY}`);

    const existingRoom = await getDailyRoom(roomName);
    console.log(`Existing room found: ${!!existingRoom}`);

    if (!existingRoom) {
      console.log(`Room ${roomName} not found, creating...`);
      const roomExpiryTime = Math.floor(twoHoursAfter / 1000) + (24 * 60 * 60); // 24 hours after session end
      const newRoom = await createDailyRoom({
        name: roomName,
        expiryTime: roomExpiryTime,
        maxParticipants: 2,
      });

      if (newRoom) {
        meetingUrl = newRoom.url;
        // Update session with meeting URL
        await database
          .update(mentorshipSessions)
          .set({ meetingUrl })
          .where(eq(mentorshipSessions.id, sessionId));
        console.log(`Room created: ${meetingUrl}`);
      } else {
        console.error('Failed to create Daily room');
        return NextResponse.json({ error: 'Failed to create video room. Please check DAILY_API_KEY configuration.' }, { status: 500 });
      }
    }

    const token = await createMeetingToken({
      roomName,
      userName,
      isOwner: isMentor, // Mentor is the room owner
      expiryTime: Math.floor(twoHoursAfter / 1000),
    });

    if (!token) {
      // If token creation fails, fall back to direct room URL (for public rooms)
      console.warn('Token creation failed, using direct URL');
      return NextResponse.json({
        meetingUrl,
        userName,
        isMentor,
        session: {
          id: session.id,
          topic: session.topic,
          scheduledAt: session.scheduledAt,
          durationMinutes: session.durationMinutes,
        },
      });
    }

    return NextResponse.json({
      meetingUrl,
      token,
      roomName,
      userName,
      isMentor,
      session: {
        id: session.id,
        topic: session.topic,
        scheduledAt: session.scheduledAt,
        durationMinutes: session.durationMinutes,
      },
    });
  } catch (error) {
    console.error('Error getting session join info:', error);
    return NextResponse.json({ error: 'Failed to get session info' }, { status: 500 });
  }
}
