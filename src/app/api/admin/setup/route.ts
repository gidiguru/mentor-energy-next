import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';

// List of emails that should be admins
const ADMIN_EMAILS = [
  'tomijoguno@gmail.com',
];

// POST: Set up admin users using Clerk authentication
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 });
  }

  try {
    // Get the current user's details from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Could not get user details from Clerk' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
    }

    const database = db();

    // Check if there are existing admins
    const existingAdmins = await database.query.users.findMany({
      where: eq(users.role, 'admin'),
    });

    // Check if requesting user's email is in admin list
    const isAllowedAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());

    if (!isAllowedAdmin && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: `Email ${userEmail} is not in the admin list` },
        { status: 403 }
      );
    }

    // Check if user exists in database
    let dbUser = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (dbUser) {
      // Update existing user to admin
      await database
        .update(users)
        .set({ role: 'admin' })
        .where(eq(users.clerkId, userId));

      return NextResponse.json({
        success: true,
        message: `Updated ${userEmail} to admin role`,
        user: { email: userEmail, role: 'admin' },
      });
    } else {
      // Create new user with admin role
      const [newUser] = await database
        .insert(users)
        .values({
          clerkId: userId,
          email: userEmail,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          profilePicture: clerkUser.imageUrl || null,
          role: 'admin',
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: `Created admin user for ${userEmail}`,
        user: { email: userEmail, role: 'admin' },
      });
    }
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up admin: ' + (error instanceof Error ? error.message : 'Unknown error') },
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
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

    const database = db();

    const admins = await database.query.users.findMany({
      where: eq(users.role, 'admin'),
    });

    // Check if current user exists in DB
    const dbUser = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    return NextResponse.json({
      adminCount: admins.length,
      adminEmails: ADMIN_EMAILS,
      admins: admins.map(a => ({ email: a.email, firstName: a.firstName })),
      currentUser: {
        clerkId: userId,
        email: userEmail,
        existsInDb: !!dbUser,
        currentRole: dbUser?.role || null,
        isInAdminList: userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false,
      },
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ error: 'Failed to check admins' }, { status: 500 });
  }
}
