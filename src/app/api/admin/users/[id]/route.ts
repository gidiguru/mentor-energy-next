import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, mentors, mentorApplications, eq } from '@/lib/db';

// DELETE - Delete a user (admin only)
export async function DELETE(
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

    // Find the user to delete
    const userToDelete = await database.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting yourself
    if (userToDelete.clerkId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete from Clerk first
    if (userToDelete.clerkId) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(userToDelete.clerkId);
      } catch (clerkError: unknown) {
        // If user doesn't exist in Clerk, continue with database deletion
        const clerkErr = clerkError as { status?: number };
        if (clerkErr?.status !== 404) {
          console.error('Error deleting user from Clerk:', clerkError);
          return NextResponse.json(
            { error: 'Failed to delete user from authentication provider' },
            { status: 500 }
          );
        }
      }
    }

    // Explicitly delete related records that might not cascade properly
    // Delete mentor record if exists (this is critical to prevent mentor role persistence)
    await database.delete(mentors).where(eq(mentors.userId, id));

    // Delete mentor applications
    await database.delete(mentorApplications).where(eq(mentorApplications.userId, id));

    // Delete from users table (other records should cascade, but mentor is explicitly handled)
    await database.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

// GET - Get a single user (admin only)
export async function GET(
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

    // Find the user
    const user = await database.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
