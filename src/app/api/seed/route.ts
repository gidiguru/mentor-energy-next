import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db/seed';

export async function POST() {
  // Only allow in development or with secret key
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    return NextResponse.json(
      { error: 'Seeding only allowed in development' },
      { status: 403 }
    );
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: result
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
