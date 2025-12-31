import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';

// PATCH - Update user role (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    // Check if current user is admin
    const currentUser = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['student', 'mentor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent admin from removing their own admin rights
    const targetUser = await database.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.clerkId === userId && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot remove your own admin rights' },
        { status: 400 }
      );
    }

    // Update the user's role
    const [updatedUser] = await database
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
