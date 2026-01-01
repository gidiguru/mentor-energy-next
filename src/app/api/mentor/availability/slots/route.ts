import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, mentors, mentorAvailability, mentorshipSessions, eq, and, gte, lt } from '@/lib/db';

// GET - Get available booking slots for a mentor on a specific date
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD format
    const durationMinutes = parseInt(searchParams.get('duration') || '60');

    if (!mentorId || !dateStr) {
      return NextResponse.json({ error: 'Mentor ID and date are required' }, { status: 400 });
    }

    const database = db();

    // Get mentor
    const mentor = await database.query.mentors.findFirst({
      where: eq(mentors.id, mentorId),
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Parse date and get day of week
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Get mentor's availability for this day
    const availability = await database.query.mentorAvailability.findMany({
      where: and(
        eq(mentorAvailability.mentorId, mentorId),
        eq(mentorAvailability.dayOfWeek, dayOfWeek),
        eq(mentorAvailability.isActive, true)
      ),
    });

    if (availability.length === 0) {
      return NextResponse.json({
        slots: [],
        message: 'Mentor is not available on this day'
      });
    }

    // Get existing sessions for this day
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSessions = await database
      .select({
        scheduledAt: mentorshipSessions.scheduledAt,
        durationMinutes: mentorshipSessions.durationMinutes,
        status: mentorshipSessions.status,
      })
      .from(mentorshipSessions)
      .where(
        and(
          eq(mentorshipSessions.mentorId, mentorId),
          gte(mentorshipSessions.scheduledAt, startOfDay),
          lt(mentorshipSessions.scheduledAt, endOfDay)
        )
      );

    // Filter out cancelled sessions
    const bookedSessions = existingSessions.filter(s =>
      s.status !== 'cancelled' && s.status !== 'no_show'
    );

    // Generate available slots
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    const now = new Date();

    for (const avail of availability) {
      // Parse start and end times
      const [startHour, startMinute] = avail.startTime.split(':').map(Number);
      const [endHour, endMinute] = avail.endTime.split(':').map(Number);

      // Generate slots in 30-minute increments
      let currentHour = startHour;
      let currentMinute = startMinute;

      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Calculate end time based on duration
        let slotEndMinute = currentMinute + durationMinutes;
        let slotEndHour = currentHour;
        while (slotEndMinute >= 60) {
          slotEndMinute -= 60;
          slotEndHour += 1;
        }
        const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;

        // Check if slot end is within availability window
        if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMinute > endMinute)) {
          break;
        }

        // Create datetime for this slot
        const slotDateTime = new Date(dateStr);
        slotDateTime.setHours(currentHour, currentMinute, 0, 0);

        // Check if slot is in the past
        const isInPast = slotDateTime <= now;

        // Check if slot overlaps with any existing session
        const isBooked = bookedSessions.some(session => {
          const sessionStart = new Date(session.scheduledAt);
          const sessionEnd = new Date(sessionStart.getTime() + session.durationMinutes * 60000);
          const slotStartTime = slotDateTime;
          const slotEndTime = new Date(slotDateTime.getTime() + durationMinutes * 60000);

          return (
            (slotStartTime >= sessionStart && slotStartTime < sessionEnd) ||
            (slotEndTime > sessionStart && slotEndTime <= sessionEnd) ||
            (slotStartTime <= sessionStart && slotEndTime >= sessionEnd)
          );
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !isBooked && !isInPast,
        });

        // Move to next slot (30 min increments)
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute -= 60;
          currentHour += 1;
        }
      }
    }

    return NextResponse.json({
      date: dateStr,
      dayOfWeek,
      slots,
      timezone: availability[0]?.timezone || 'Africa/Lagos',
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 });
  }
}
