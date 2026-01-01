import { NextRequest, NextResponse } from 'next/server';
import { db, mentors, users, eq, and } from '@/lib/db';

// GET - List all verified, available mentors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expertise = searchParams.get('expertise');
    const search = searchParams.get('search');

    const database = db();

    // Get all verified and available mentors with their user info
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
      );

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

    // Transform to cleaner format
    const result = filteredMentors.map(m => ({
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

    return NextResponse.json({ mentors: result });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
  }
}
