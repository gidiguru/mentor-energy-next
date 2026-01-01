import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, mentors, eq } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();
    const profile = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!profile) {
      // User not in database yet, get info from Clerk
      const clerkUser = await currentUser();
      return NextResponse.json({
        profile: null,
        isMentor: false,
        clerkUser: {
          id: clerkUser?.id,
          email: clerkUser?.emailAddresses[0]?.emailAddress,
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
        },
      });
    }

    // Check if user is an approved mentor
    const mentorRecord = await database.query.mentors.findFirst({
      where: eq(mentors.userId, profile.id),
    });

    const isMentor = profile.role === 'mentor' || (!!mentorRecord && mentorRecord.isVerified);

    return NextResponse.json({ profile, isMentor });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();
    const clerkUser = await currentUser();
    const body = await request.json();
    const { discipline, qualification, university, role } = body;

    // Check if user exists
    const existingUser = await database.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (existingUser) {
      // Update existing user
      const [updated] = await database
        .update(users)
        .set({
          discipline,
          qualification,
          university,
          role: role as 'student' | 'mentor' | 'admin',
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId))
        .returning();

      return NextResponse.json({ profile: updated });
    } else {
      // Create new user
      const email = clerkUser?.emailAddresses[0]?.emailAddress || '';
      const firstName = clerkUser?.firstName || null;
      const lastName = clerkUser?.lastName || null;

      const [created] = await database
        .insert(users)
        .values({
          clerkId: userId,
          email,
          firstName,
          lastName,
          discipline,
          qualification,
          university,
          role: (role as 'student' | 'mentor' | 'admin') || 'student',
        })
        .returning();

      // Send welcome email to new user (don't await - send in background)
      const userName = [firstName, lastName].filter(Boolean).join(' ') || 'there';
      sendWelcomeEmail({ to: email, userName }).catch(err =>
        console.error('Error sending welcome email:', err)
      );

      return NextResponse.json({ profile: created });
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();
    const body = await request.json();
    const { first_name, last_name, discipline, qualification, university } = body;

    const [updated] = await database
      .update(users)
      .set({
        firstName: first_name,
        lastName: last_name,
        discipline,
        qualification,
        university,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
