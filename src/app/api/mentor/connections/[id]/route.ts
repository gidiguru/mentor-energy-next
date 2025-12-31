import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorConnections, eq, and } from '@/lib/db';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH - Update connection status (accept/decline)
export async function PATCH(request: NextRequest, { params }: Props) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, response } = body;

    if (!status || !['accepted', 'declined', 'ended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const database = db();

    // Get user and their mentor profile
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the connection
    const connection = await database.query.mentorConnections.findFirst({
      where: eq(mentorConnections.id, id),
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Check authorization - only the mentor can accept/decline, either party can end
    const isMentor = user.mentor?.id === connection.mentorId;
    const isStudent = user.id === connection.studentId;

    if (status === 'ended') {
      if (!isMentor && !isStudent) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    } else {
      if (!isMentor) {
        return NextResponse.json({ error: 'Only the mentor can accept or decline' }, { status: 403 });
      }
    }

    // Update connection
    const [updated] = await database
      .update(mentorConnections)
      .set({
        status,
        mentorResponse: response || null,
        updatedAt: new Date(),
      })
      .where(eq(mentorConnections.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      connection: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
  }
}
