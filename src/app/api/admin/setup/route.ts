import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';

// List of emails that should be admins
const ADMIN_EMAILS = [
  'tomijoguno@gmail.com',
];

// POST: Set up admin users (can only be run by existing admins or when no admins exist)
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    // Check if requesting user is admin or if no admins exist
    const existingAdmins = await database.query.users.findMany({
      where: eq(users.role, 'admin'),
    });

    const requestingUser = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    // Allow setup if no admins exist or if requester is already admin
    if (existingAdmins.length > 0 && requestingUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can run this setup' },
        { status: 403 }
      );
    }

    const results = [];

    for (const email of ADMIN_EMAILS) {
      const user = await database.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (user) {
        await database
          .update(users)
          .set({ role: 'admin' })
          .where(eq(users.email, email));
        results.push({ email, status: 'updated to admin' });
      } else {
        results.push({ email, status: 'user not found - they need to sign up first' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin setup completed',
      results,
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up admins' },
      { status: 500 }
    );
  }
}

// GET: Check admin setup status
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    const admins = await database.query.users.findMany({
      where: eq(users.role, 'admin'),
    });

    return NextResponse.json({
      adminCount: admins.length,
      adminEmails: ADMIN_EMAILS,
      admins: admins.map(a => ({ email: a.email, firstName: a.firstName })),
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ error: 'Failed to check admins' }, { status: 500 });
  }
}
