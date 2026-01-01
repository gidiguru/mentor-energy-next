import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorAvailability, eq, and } from '@/lib/db';

// GET - Get mentor's availability
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    const database = db();

    // If mentorId is provided, get that mentor's availability (public)
    if (mentorId) {
      const availability = await database.query.mentorAvailability.findMany({
        where: and(
          eq(mentorAvailability.mentorId, mentorId),
          eq(mentorAvailability.isActive, true)
        ),
        orderBy: (a, { asc }) => [asc(a.dayOfWeek), asc(a.startTime)],
      });

      return NextResponse.json({ availability });
    }

    // Otherwise, get current user's availability (must be a mentor)
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

    const availability = await database.query.mentorAvailability.findMany({
      where: eq(mentorAvailability.mentorId, user.mentor.id),
      orderBy: (a, { asc }) => [asc(a.dayOfWeek), asc(a.startTime)],
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

// POST - Add availability slot
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dayOfWeek, startTime, endTime, timezone } = body;

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Day, start time, and end time are required' }, { status: 400 });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Invalid day of week' }, { status: 400 });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
    }

    // Validate start time is before end time
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
    }

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

    // Create availability slot
    const [slot] = await database
      .insert(mentorAvailability)
      .values({
        mentorId: user.mentor.id,
        dayOfWeek,
        startTime,
        endTime,
        timezone: timezone || 'Africa/Lagos',
      })
      .returning();

    return NextResponse.json({
      success: true,
      slot,
    });
  } catch (error) {
    console.error('Error creating availability:', error);
    return NextResponse.json({ error: 'Failed to create availability' }, { status: 500 });
  }
}

// PUT - Update all availability (replace)
export async function PUT(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slots } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'Slots must be an array' }, { status: 400 });
    }

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

    // Delete existing slots
    await database
      .delete(mentorAvailability)
      .where(eq(mentorAvailability.mentorId, user.mentor.id));

    // Insert new slots
    if (slots.length > 0) {
      const validSlots = slots.filter((slot: { dayOfWeek: number; startTime: string; endTime: string }) => {
        return (
          slot.dayOfWeek >= 0 &&
          slot.dayOfWeek <= 6 &&
          slot.startTime &&
          slot.endTime &&
          slot.startTime < slot.endTime
        );
      });

      if (validSlots.length > 0) {
        await database.insert(mentorAvailability).values(
          validSlots.map((slot: { dayOfWeek: number; startTime: string; endTime: string; timezone?: string }) => ({
            mentorId: user.mentor!.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            timezone: slot.timezone || 'Africa/Lagos',
          }))
        );
      }
    }

    // Get updated availability
    const availability = await database.query.mentorAvailability.findMany({
      where: eq(mentorAvailability.mentorId, user.mentor.id),
      orderBy: (a, { asc }) => [asc(a.dayOfWeek), asc(a.startTime)],
    });

    return NextResponse.json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
