import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, mentors, eq } from '@/lib/db';
import { sendMentorStatusRevokedEmail } from '@/lib/email';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH - Update mentor status (revoke/reinstate)
export async function PATCH(request: NextRequest, { params }: Props) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['revoke', 'reinstate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const database = db();

    // Check if user is admin
    const adminUser = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get mentor
    const mentor = await database.query.mentors.findFirst({
      where: eq(mentors.id, id),
      with: {
        user: true,
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    if (action === 'revoke') {
      // Update mentor profile - set inactive
      await database
        .update(mentors)
        .set({
          isAvailable: false,
          isVerified: false,
          updatedAt: new Date(),
        })
        .where(eq(mentors.id, id));

      // Update user role back to student
      await database
        .update(users)
        .set({
          role: 'student',
          updatedAt: new Date(),
        })
        .where(eq(users.id, mentor.userId));

      // Send notification email
      if (mentor.user?.email) {
        await sendMentorStatusRevokedEmail({
          to: mentor.user.email,
          userName: mentor.user.firstName || mentor.user.email,
          reason: reason || undefined,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Mentor status revoked',
      });
    } else {
      // Reinstate mentor
      await database
        .update(mentors)
        .set({
          isAvailable: true,
          isVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(mentors.id, id));

      // Update user role back to mentor
      await database
        .update(users)
        .set({
          role: 'mentor',
          updatedAt: new Date(),
        })
        .where(eq(users.id, mentor.userId));

      return NextResponse.json({
        success: true,
        message: 'Mentor status reinstated',
      });
    }
  } catch (error) {
    console.error('Error updating mentor status:', error);
    return NextResponse.json({ error: 'Failed to update mentor status' }, { status: 500 });
  }
}
