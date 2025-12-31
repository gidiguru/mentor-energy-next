import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, eq } from '@/lib/db';
import { sendCertificateEmail, getEmailDiagnostics } from '@/lib/email';

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

    // Get diagnostics for debugging
    const diagnostics = getEmailDiagnostics();
    console.log('Email diagnostics:', diagnostics);

    if (!diagnostics.hasApiKey) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured',
        debug: {
          hasApiKey: diagnostics.hasApiKey,
          keyLength: diagnostics.keyLength,
          keyPrefix: diagnostics.keyPrefix,
          envVars: diagnostics.availableEnvVars,
        },
      }, { status: 500 });
    }

    // Send test certificate email
    const result = await sendCertificateEmail({
      to: testEmail,
      userName: user.firstName || 'Test User',
      moduleTitle: 'Introduction to Energy Geology (Test)',
      certificateNumber: 'CERT-TEST-' + Date.now().toString(36).toUpperCase(),
      completedAt: new Date(),
    });

    if (result && 'id' in result) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail}`,
        emailId: result.id,
      });
    } else {
      const errorMsg = result && 'error' in result ? result.error : 'Unknown error';
      return NextResponse.json({
        error: `Resend API error: ${errorMsg}`,
        debug: {
          ...diagnostics,
          resendError: errorMsg,
        },
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
