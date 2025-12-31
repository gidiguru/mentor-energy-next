import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorshipSessions, eq } from '@/lib/db';

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
