import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, mentorshipSessions, eq, and, isNotNull, desc } from '@/lib/db';

// GET - Get reviews for a mentor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    const database = db();

    // Get completed sessions with ratings for this mentor
    const reviews = await database
      .select({
        id: mentorshipSessions.id,
        rating: mentorshipSessions.rating,
        topic: mentorshipSessions.topic,
        scheduledAt: mentorshipSessions.scheduledAt,
        studentId: users.id,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentPicture: users.profilePicture,
      })
      .from(mentorshipSessions)
      .innerJoin(users, eq(mentorshipSessions.studentId, users.id))
      .where(
        and(
          eq(mentorshipSessions.mentorId, mentorId),
          eq(mentorshipSessions.status, 'completed'),
          isNotNull(mentorshipSessions.rating)
        )
      )
      .orderBy(desc(mentorshipSessions.scheduledAt))
      .limit(20);

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Get rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      if (r.rating && r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    return NextResponse.json({
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        topic: r.topic,
        date: r.scheduledAt,
        student: {
          id: r.studentId,
          name: `${r.studentFirstName || ''} ${r.studentLastName || ''}`.trim() || 'Anonymous',
          profilePicture: r.studentPicture,
        },
      })),
      stats: {
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
