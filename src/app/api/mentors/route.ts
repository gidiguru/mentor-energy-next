import { NextRequest, NextResponse } from 'next/server';
import { db, mentors, users, eq, and, desc } from '@/lib/db';

// GET - List all verified, available mentors with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertise = searchParams.get('expertise');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const database = db();

    // Get verified and available mentors with their user info (with pagination)
    const mentorList = await database
      .select({
        id: mentors.id,
        bio: mentors.bio,
        expertise: mentors.expertise,
        specializations: mentors.specializations,
        yearsExperience: mentors.yearsExperience,
        currentRole: mentors.currentRole,
        company: mentors.company,
        sessionCount: mentors.sessionCount,
        averageRating: mentors.averageRating,
        isAvailable: mentors.isAvailable,
        userId: mentors.userId,
        // User info
        firstName: users.firstName,
        lastName: users.lastName,
        profilePicture: users.profilePicture,
        discipline: users.discipline,
        linkedinUrl: users.linkedinUrl,
      })
      .from(mentors)
      .innerJoin(users, eq(mentors.userId, users.id))
      .where(
        and(
          eq(mentors.isVerified, true),
          eq(mentors.isAvailable, true)
        )
      )
      .orderBy(desc(mentors.averageRating))
      .limit(limit + 1) // Fetch one extra to check if there's more
      .offset(offset);

    // Filter by expertise if specified
    let filteredMentors = mentorList;
    if (expertise) {
      filteredMentors = mentorList.filter(m =>
        m.expertise?.some(e => e.toLowerCase().includes(expertise.toLowerCase()))
      );
    }

    // Filter by search term (name, role, company)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMentors = filteredMentors.filter(m =>
        m.firstName?.toLowerCase().includes(searchLower) ||
        m.lastName?.toLowerCase().includes(searchLower) ||
        m.currentRole?.toLowerCase().includes(searchLower) ||
        m.company?.toLowerCase().includes(searchLower) ||
        m.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Check if there's more data
    const hasMore = filteredMentors.length > limit;
    const paginatedMentors = hasMore ? filteredMentors.slice(0, limit) : filteredMentors;

    // Transform to cleaner format
    const result = paginatedMentors.map(m => ({
      id: m.id,
      userId: m.userId,
      name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Mentor',
      profilePicture: m.profilePicture,
      bio: m.bio,
      expertise: m.expertise || [],
      specializations: m.specializations || [],
      yearsExperience: m.yearsExperience,
      currentRole: m.currentRole,
      company: m.company,
      discipline: m.discipline,
      linkedinUrl: m.linkedinUrl,
      sessionCount: m.sessionCount,
      averageRating: m.averageRating ? parseFloat(m.averageRating) : null,
      isAvailable: m.isAvailable,
    }));

    return NextResponse.json({
      mentors: result,
      pagination: {
        page,
        limit,
        hasMore,
      }
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
  }
}
