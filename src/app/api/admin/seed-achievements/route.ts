import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, achievements, eq } from '@/lib/db';

const DEFAULT_ACHIEVEMENTS = [
  // Completion achievements
  { code: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', category: 'completion', points: 10 },
  { code: 'lessons_5', name: 'Getting Started', description: 'Complete 5 lessons', icon: '📚', category: 'completion', points: 25 },
  { code: 'lessons_10', name: 'Dedicated Learner', description: 'Complete 10 lessons', icon: '🌟', category: 'completion', points: 50 },
  { code: 'lessons_25', name: 'Knowledge Seeker', description: 'Complete 25 lessons', icon: '🏆', category: 'completion', points: 100 },
  { code: 'lessons_50', name: 'Scholar', description: 'Complete 50 lessons', icon: '🎓', category: 'completion', points: 200 },
  { code: 'lessons_100', name: 'Master Learner', description: 'Complete 100 lessons', icon: '👑', category: 'completion', points: 500 },

  // Streak achievements
  { code: 'streak_3', name: 'On a Roll', description: 'Maintain a 3-day learning streak', icon: '🔥', category: 'streak', points: 25 },
  { code: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day learning streak', icon: '💪', category: 'streak', points: 50 },
  { code: 'streak_14', name: 'Two Week Champion', description: 'Maintain a 14-day learning streak', icon: '⚡', category: 'streak', points: 100 },
  { code: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day learning streak', icon: '🌙', category: 'streak', points: 250 },

  // Certificate achievements
  { code: 'first_certificate', name: 'Certified', description: 'Earn your first certificate', icon: '📜', category: 'certificate', points: 100 },
  { code: 'certificates_3', name: 'Triple Certified', description: 'Earn 3 certificates', icon: '🏅', category: 'certificate', points: 300 },
  { code: 'certificates_5', name: 'Expert', description: 'Earn 5 certificates', icon: '🌟', category: 'certificate', points: 500 },

  // Engagement achievements
  { code: 'first_comment', name: 'Voice Heard', description: 'Post your first comment', icon: '💬', category: 'engagement', points: 10 },
  { code: 'comments_10', name: 'Active Participant', description: 'Post 10 comments', icon: '🗣️', category: 'engagement', points: 50 },
];

// POST /api/admin/seed-achievements - Seed default achievements (admin only)
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    // Check if user is admin
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get existing achievements
    const existingAchievements = await database.query.achievements.findMany();
    const existingCodes = new Set(existingAchievements.map(a => a.code));

    // Insert only new achievements
    const newAchievements = DEFAULT_ACHIEVEMENTS.filter(a => !existingCodes.has(a.code));

    if (newAchievements.length > 0) {
      await database.insert(achievements).values(newAchievements);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${newAchievements.length} new achievements`,
      total: existingAchievements.length + newAchievements.length,
      newAchievements: newAchievements.map(a => a.code),
    });
  } catch (error) {
    console.error('Error seeding achievements:', error);
    return NextResponse.json({ error: 'Failed to seed achievements' }, { status: 500 });
  }
}

// GET /api/admin/seed-achievements - Check current achievements
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    const existingAchievements = await database.query.achievements.findMany({
      orderBy: (a, { asc }) => [asc(a.category), asc(a.points)],
    });

    return NextResponse.json({
      achievements: existingAchievements,
      count: existingAchievements.length,
      defaultCount: DEFAULT_ACHIEVEMENTS.length,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
