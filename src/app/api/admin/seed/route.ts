import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db/seed';
import { requireAdmin } from '@/lib/auth';

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      data: result,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
