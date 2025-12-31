import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';
import { sendCertificateEmail } from '@/lib/email';

// POST /api/admin/test-email - Send a test certificate email (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get optional email from body, otherwise use admin's email
    const body = await request.json().catch(() => ({}));
    const testEmail = body.email || user.email;

    // Send test certificate email
    const result = await sendCertificateEmail({
      to: testEmail,
      userName: user.firstName || 'Test User',
      moduleTitle: 'Introduction to Energy Geology (Test)',
      certificateNumber: 'CERT-TEST-' + Date.now().toString(36).toUpperCase(),
      completedAt: new Date(),
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail}`,
        emailId: result.id,
      });
    } else {
      return NextResponse.json({
        error: 'Failed to send email - check RESEND_API_KEY configuration',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
