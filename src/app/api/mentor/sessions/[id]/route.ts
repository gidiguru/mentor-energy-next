import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorshipSessions, eq } from '@/lib/db';
import { sendSessionCancelledEmail } from '@/lib/email';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH - Update session
export async function PATCH(request: NextRequest, { params }: Props) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, meetingUrl, notes, studentNotes, mentorFeedback, rating } = body;

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

    // Get session
    const session = await database.query.mentorshipSessions.findFirst({
      where: eq(mentorshipSessions.id, id),
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check authorization
    const isMentor = user.mentor?.id === session.mentorId;
    const isStudent = user.id === session.studentId;

    if (!isMentor && !isStudent) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Build update object based on role
    const updateData: Partial<typeof session> = {
      updatedAt: new Date(),
    };

    if (status && ['scheduled', 'completed', 'cancelled', 'no_show'].includes(status)) {
      updateData.status = status;
    }

    if (isMentor) {
      if (meetingUrl !== undefined) updateData.meetingUrl = meetingUrl;
      if (notes !== undefined) updateData.notes = notes;
      if (mentorFeedback !== undefined) updateData.mentorFeedback = mentorFeedback;
    }

    if (isStudent) {
      if (studentNotes !== undefined) updateData.studentNotes = studentNotes;
      if (rating !== undefined && rating >= 1 && rating <= 5) {
        updateData.rating = rating;
      }
    }

    // Update session
    const [updated] = await database
      .update(mentorshipSessions)
      .set(updateData)
      .where(eq(mentorshipSessions.id, id))
      .returning();

    // Update mentor's session count and rating if completed with rating
    if (status === 'completed' && isMentor) {
      await database
        .update(mentors)
        .set({
          sessionCount: (user.mentor?.sessionCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(mentors.id, session.mentorId));
    }

    // Send cancellation emails if session was cancelled
    if (status === 'cancelled') {
      // Get mentor info
      const mentor = await database.query.mentors.findFirst({
        where: eq(mentors.id, session.mentorId),
      });
      const mentorUser = mentor ? await database.query.users.findFirst({
        where: eq(users.id, mentor.userId),
      }) : null;

      // Get student info
      const student = await database.query.users.findFirst({
        where: eq(users.id, session.studentId),
      });

      const mentorName = `${mentorUser?.firstName || ''} ${mentorUser?.lastName || ''}`.trim() || 'Mentor';
      const studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student';
      const cancelledBy = isMentor ? mentorName : studentName;

      // Send to student (if cancelled by mentor)
      if (isMentor && student?.email) {
        await sendSessionCancelledEmail({
          to: student.email,
          recipientName: studentName,
          otherPartyName: mentorName,
          sessionDate: session.scheduledAt,
          cancelledBy,
        });
      }

      // Send to mentor (if cancelled by student)
      if (isStudent && mentorUser?.email) {
        await sendSessionCancelledEmail({
          to: mentorUser.email,
          recipientName: mentorName,
          otherPartyName: studentName,
          sessionDate: session.scheduledAt,
          cancelledBy,
        });
      }
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
