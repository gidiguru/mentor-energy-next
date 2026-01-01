import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorshipSessions, eq, and, gte, lt } from '@/lib/db';
import { sendSessionReminderEmail } from '@/lib/email';

// This endpoint should be called by a cron job (e.g., every hour)
// Netlify/Vercel can schedule this endpoint to run periodically

export async function GET(request: NextRequest) {
  // Verify the request is from a trusted source (cron job)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow in development or if secret matches
  if (process.env.NODE_ENV !== 'development' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();
    const now = new Date();

    // Find sessions happening in 24 hours (23-25 hour window)
    const in24HoursStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24HoursEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find sessions happening in 1 hour (30-90 minute window)
    const in1HourStart = new Date(now.getTime() + 30 * 60 * 1000);
    const in1HourEnd = new Date(now.getTime() + 90 * 60 * 1000);

    // Get sessions for 24h reminder
    const sessions24h = await database
      .select({
        id: mentorshipSessions.id,
        scheduledAt: mentorshipSessions.scheduledAt,
        topic: mentorshipSessions.topic,
        meetingUrl: mentorshipSessions.meetingUrl,
        studentId: mentorshipSessions.studentId,
        mentorId: mentorshipSessions.mentorId,
      })
      .from(mentorshipSessions)
      .where(
        and(
          eq(mentorshipSessions.status, 'scheduled'),
          gte(mentorshipSessions.scheduledAt, in24HoursStart),
          lt(mentorshipSessions.scheduledAt, in24HoursEnd)
        )
      );

    // Get sessions for 1h reminder
    const sessions1h = await database
      .select({
        id: mentorshipSessions.id,
        scheduledAt: mentorshipSessions.scheduledAt,
        topic: mentorshipSessions.topic,
        meetingUrl: mentorshipSessions.meetingUrl,
        studentId: mentorshipSessions.studentId,
        mentorId: mentorshipSessions.mentorId,
      })
      .from(mentorshipSessions)
      .where(
        and(
          eq(mentorshipSessions.status, 'scheduled'),
          gte(mentorshipSessions.scheduledAt, in1HourStart),
          lt(mentorshipSessions.scheduledAt, in1HourEnd)
        )
      );

    let emailsSent = 0;

    // Send 24h reminders
    for (const session of sessions24h) {
      try {
        // Get student info
        const student = await database.query.users.findFirst({
          where: eq(users.id, session.studentId),
        });

        // Get mentor info
        const mentor = await database.query.mentors.findFirst({
          where: eq(mentors.id, session.mentorId),
        });
        const mentorUser = mentor ? await database.query.users.findFirst({
          where: eq(users.id, mentor.userId),
        }) : null;

        const mentorName = `${mentorUser?.firstName || ''} ${mentorUser?.lastName || ''}`.trim() || 'Your mentor';
        const studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student';

        // Send to student
        if (student?.email) {
          await sendSessionReminderEmail({
            to: student.email,
            userName: studentName,
            mentorName,
            sessionDate: session.scheduledAt,
            sessionTopic: session.topic || undefined,
            meetingUrl: session.meetingUrl || undefined,
            reminderType: '24h',
          });
          emailsSent++;
        }

        // Send to mentor
        if (mentorUser?.email) {
          await sendSessionReminderEmail({
            to: mentorUser.email,
            userName: mentorName,
            mentorName: studentName, // In this context, we're telling the mentor about their student
            sessionDate: session.scheduledAt,
            sessionTopic: session.topic || undefined,
            meetingUrl: session.meetingUrl || undefined,
            reminderType: '24h',
          });
          emailsSent++;
        }
      } catch (error) {
        console.error(`Error sending 24h reminder for session ${session.id}:`, error);
      }
    }

    // Send 1h reminders
    for (const session of sessions1h) {
      try {
        // Get student info
        const student = await database.query.users.findFirst({
          where: eq(users.id, session.studentId),
        });

        // Get mentor info
        const mentor = await database.query.mentors.findFirst({
          where: eq(mentors.id, session.mentorId),
        });
        const mentorUser = mentor ? await database.query.users.findFirst({
          where: eq(users.id, mentor.userId),
        }) : null;

        const mentorName = `${mentorUser?.firstName || ''} ${mentorUser?.lastName || ''}`.trim() || 'Your mentor';
        const studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student';

        // Send to student
        if (student?.email) {
          await sendSessionReminderEmail({
            to: student.email,
            userName: studentName,
            mentorName,
            sessionDate: session.scheduledAt,
            sessionTopic: session.topic || undefined,
            meetingUrl: session.meetingUrl || undefined,
            reminderType: '1h',
          });
          emailsSent++;
        }

        // Send to mentor
        if (mentorUser?.email) {
          await sendSessionReminderEmail({
            to: mentorUser.email,
            userName: mentorName,
            mentorName: studentName,
            sessionDate: session.scheduledAt,
            sessionTopic: session.topic || undefined,
            meetingUrl: session.meetingUrl || undefined,
            reminderType: '1h',
          });
          emailsSent++;
        }
      } catch (error) {
        console.error(`Error sending 1h reminder for session ${session.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      sessions24h: sessions24h.length,
      sessions1h: sessions1h.length,
      emailsSent,
    });
  } catch (error) {
    console.error('Error running session reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
