import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  discipline: string | null;
  qualification: string | null;
  university: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const results = await sql`SELECT * FROM users WHERE clerk_id = ${userId}`;
    const profile = results[0] as UserProfile | undefined;

    if (!profile) {
      // User not in database yet, get info from Clerk
      const clerkUser = await currentUser();
      return NextResponse.json({
        profile: null,
        clerkUser: {
          id: clerkUser?.id,
          email: clerkUser?.emailAddresses[0]?.emailAddress,
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
        },
      });
    }

    return NextResponse.json({ profile });
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
    const sql = getDb();
    const clerkUser = await currentUser();
    const body = await request.json();
    const { discipline, qualification, university, role } = body;

    // Check if user exists
    const existingResults = await sql`SELECT * FROM users WHERE clerk_id = ${userId}`;
    const existingUser = existingResults[0] as UserProfile | undefined;

    if (existingUser) {
      // Update existing user
      const updated = await sql`
        UPDATE users
        SET discipline = ${discipline},
            qualification = ${qualification},
            university = ${university},
            role = ${role},
            updated_at = NOW()
        WHERE clerk_id = ${userId}
        RETURNING *
      `;
      return NextResponse.json({ profile: updated[0] });
    } else {
      // Create new user
      const email = clerkUser?.emailAddresses[0]?.emailAddress || '';
      const firstName = clerkUser?.firstName || null;
      const lastName = clerkUser?.lastName || null;

      const created = await sql`
        INSERT INTO users (clerk_id, email, first_name, last_name, discipline, qualification, university, role)
        VALUES (${userId}, ${email}, ${firstName}, ${lastName}, ${discipline}, ${qualification}, ${university}, ${role})
        RETURNING *
      `;
      return NextResponse.json({ profile: created[0] });
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
    const sql = getDb();
    const body = await request.json();
    const { first_name, last_name, discipline, qualification, university } = body;

    const updated = await sql`
      UPDATE users
      SET first_name = ${first_name},
          last_name = ${last_name},
          discipline = ${discipline},
          qualification = ${qualification},
          university = ${university},
          updated_at = NOW()
      WHERE clerk_id = ${userId}
      RETURNING *
    `;

    if (!updated[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: updated[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
