import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentorAvailability, eq } from '@/lib/db';

interface Props {
  params: Promise<{ id: string }>;
}

// DELETE - Remove availability slot
export async function DELETE(request: NextRequest, { params }: Props) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const database = db();

    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.mentor) {
      return NextResponse.json({ error: 'Not a mentor' }, { status: 403 });
    }

    // Get the slot to verify ownership
    const slot = await database.query.mentorAvailability.findFirst({
      where: eq(mentorAvailability.id, id),
    });

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.mentorId !== user.mentor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete the slot
    await database
      .delete(mentorAvailability)
      .where(eq(mentorAvailability.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 });
  }
}

// PATCH - Toggle availability slot active status
export async function PATCH(request: NextRequest, { params }: Props) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { isActive } = body;

    const database = db();

    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        mentor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.mentor) {
      return NextResponse.json({ error: 'Not a mentor' }, { status: 403 });
    }

    // Get the slot to verify ownership
    const slot = await database.query.mentorAvailability.findFirst({
      where: eq(mentorAvailability.id, id),
    });

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.mentorId !== user.mentor.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Update the slot
    const [updated] = await database
      .update(mentorAvailability)
      .set({ isActive: isActive ?? !slot.isActive })
      .where(eq(mentorAvailability.id, id))
      .returning();

    return NextResponse.json({ success: true, slot: updated });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
