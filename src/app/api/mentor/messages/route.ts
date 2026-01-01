import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorConnections, mentorMessages, eq, and, or, desc } from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Get messages for a connection
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get('connectionId');

  if (!connectionId) {
    return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
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

    // Get the connection and verify user is a participant
    const connection = await database.query.mentorConnections.findFirst({
      where: eq(mentorConnections.id, connectionId),
      with: {
        mentor: {
          with: {
            user: true,
          },
        },
        student: true,
      },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Verify user is either the mentor or student in this connection
    const isMentor = user.mentor && connection.mentorId === user.mentor.id;
    const isStudent = connection.studentId === user.id;

    if (!isMentor && !isStudent) {
      return NextResponse.json({ error: 'You are not a participant in this connection' }, { status: 403 });
    }

    // Get messages for this connection
    const messages = await database
      .select({
        id: mentorMessages.id,
        content: mentorMessages.content,
        isRead: mentorMessages.isRead,
        createdAt: mentorMessages.createdAt,
        senderId: mentorMessages.senderId,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderProfilePicture: users.profilePicture,
      })
      .from(mentorMessages)
      .innerJoin(users, eq(mentorMessages.senderId, users.id))
      .where(eq(mentorMessages.connectionId, connectionId))
      .orderBy(desc(mentorMessages.createdAt))
      .limit(100);

    // Mark unread messages as read (messages not sent by current user)
    await database
      .update(mentorMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(mentorMessages.connectionId, connectionId),
          eq(mentorMessages.isRead, false),
          // Don't mark own messages as read
          or(
            isMentor ? eq(mentorMessages.senderId, connection.studentId) : undefined,
            isStudent ? eq(mentorMessages.senderId, connection.mentor.userId) : undefined
          )
        )
      );

    // Get other participant info
    const otherParticipant = isMentor
      ? {
          id: connection.student.id,
          name: `${connection.student.firstName || ''} ${connection.student.lastName || ''}`.trim(),
          profilePicture: connection.student.profilePicture,
        }
      : {
          id: connection.mentor.user.id,
          name: `${connection.mentor.user.firstName || ''} ${connection.mentor.user.lastName || ''}`.trim(),
          profilePicture: connection.mentor.user.profilePicture,
        };

    return NextResponse.json({
      messages: messages.reverse().map(m => ({
        id: m.id,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt,
        sender: {
          id: m.senderId,
          name: `${m.senderFirstName || ''} ${m.senderLastName || ''}`.trim(),
          profilePicture: m.senderProfilePicture,
        },
        isOwnMessage: String(m.senderId) === String(user.id),
      })),
      otherParticipant,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { connectionId, content } = body;

    if (!connectionId || !content?.trim()) {
      return NextResponse.json({ error: 'Connection ID and message content are required' }, { status: 400 });
    }

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

    // Get the connection and verify user is a participant
    const connection = await database.query.mentorConnections.findFirst({
      where: eq(mentorConnections.id, connectionId),
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Verify user is either the mentor or student
    const isMentor = user.mentor && connection.mentorId === user.mentor.id;
    const isStudent = connection.studentId === user.id;

    if (!isMentor && !isStudent) {
      return NextResponse.json({ error: 'You are not a participant in this connection' }, { status: 403 });
    }

    // Only allow messaging for accepted connections
    if (connection.status !== 'accepted') {
      return NextResponse.json({ error: 'You can only message in accepted connections' }, { status: 403 });
    }

    // Create the message
    const [message] = await database
      .insert(mentorMessages)
      .values({
        connectionId,
        senderId: user.id,
        content: content.trim(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          profilePicture: user.profilePicture,
        },
        isOwnMessage: true,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PATCH - Edit a message (only own messages)
export async function PATCH(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messageId, content } = body;

    if (!messageId || !content?.trim()) {
      return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    const database = db();

    // Get current user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the message
    const message = await database.query.mentorMessages.findFirst({
      where: eq(mentorMessages.id, messageId),
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user owns this message
    if (message.senderId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }

    // Update the message
    const [updated] = await database
      .update(mentorMessages)
      .set({ content: content.trim() })
      .where(eq(mentorMessages.id, messageId))
      .returning();

    return NextResponse.json({
      success: true,
      message: {
        id: updated.id,
        content: updated.content,
      },
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}

// DELETE - Delete a message (only own messages)
export async function DELETE(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');

  if (!messageId) {
    return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
  }

  try {
    const database = db();

    // Get current user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the message
    const message = await database.query.mentorMessages.findFirst({
      where: eq(mentorMessages.id, messageId),
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user owns this message
    if (message.senderId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    // Delete the message
    await database
      .delete(mentorMessages)
      .where(eq(mentorMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
