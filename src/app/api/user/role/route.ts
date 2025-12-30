import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ role: null, isAdmin: false });
  }

  try {
    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ role: 'student', isAdmin: false });
    }

    return NextResponse.json({
      role: user.role,
      isAdmin: user.role === 'admin',
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json({ role: null, isAdmin: false });
  }
}
