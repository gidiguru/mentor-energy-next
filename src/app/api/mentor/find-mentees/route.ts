import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, mentors, mentorConnections, eq, and, ne } from '@/lib/db';

// GET - Find potential mentees for a mentor based on matching interests
export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const database = db();

    // Get user and verify they are a mentor
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get mentor profile
    const mentorRecord = await database.query.mentors.findFirst({
      where: eq(mentors.userId, user.id),
    });

    if (!mentorRecord) {
      return NextResponse.json({ error: 'You are not a mentor' }, { status: 403 });
    }

    // Get all existing connections for this mentor (to exclude them)
    const existingConnections = await database
      .select({ studentId: mentorConnections.studentId })
      .from(mentorConnections)
      .where(eq(mentorConnections.mentorId, mentorRecord.id));

    const connectedStudentIds = existingConnections.map(c => c.studentId);

    // Get all students (users with role 'student')
    const allStudents = await database.query.users.findMany({
      where: eq(users.role, 'student'),
    });

    // Filter out already connected students and the mentor themselves
    const potentialMentees = allStudents.filter(student =>
      student.id !== user.id && !connectedStudentIds.includes(student.id)
    );

    // Score and sort students by matching interests
    const mentorExpertise = mentorRecord.expertise || [];
    const scoredMentees = potentialMentees.map(student => {
      let matchScore = 0;
      const studentDiscipline = student.discipline?.toLowerCase() || '';
      const studentBio = student.bio?.toLowerCase() || '';

      // Check if student's discipline matches any mentor expertise
      mentorExpertise.forEach(expertise => {
        const expertiseLower = expertise.toLowerCase();
        if (studentDiscipline.includes(expertiseLower) || expertiseLower.includes(studentDiscipline)) {
          matchScore += 3; // High score for discipline match
        }
        if (studentBio.includes(expertiseLower)) {
          matchScore += 1; // Lower score for bio mention
        }
      });

      return {
        id: student.id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email,
        email: student.email,
        profilePicture: student.profilePicture,
        discipline: student.discipline,
        qualification: student.qualification,
        university: student.university,
        bio: student.bio,
        matchScore,
        createdAt: student.createdAt,
      };
    });

    // Sort by match score (highest first), then by recent registration
    scoredMentees.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      mentees: scoredMentees,
      mentorExpertise,
    });
  } catch (error) {
    console.error('Error finding mentees:', error);
    return NextResponse.json({ error: 'Failed to find mentees' }, { status: 500 });
  }
}
