import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';

// GET - List all users (admin only)
export async function GET() {
  const { userId } = await auth();

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

    // Fetch all users
    const allUsers = await database.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
