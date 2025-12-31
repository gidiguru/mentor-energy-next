import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, certificates, learningModules, eq } from '@/lib/db';

// POST /api/admin/test-certificate - Create a test certificate (admin only)
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

    // Get a module to associate with the certificate
    const modules = await database.query.learningModules.findMany({
      limit: 1,
    });

    if (modules.length === 0) {
      return NextResponse.json({
        error: 'No modules found. Please seed sample data first.'
      }, { status: 400 });
    }

    const module = modules[0];

    // Check if a test certificate already exists for this user and module
    const existingCert = await database.query.certificates.findFirst({
      where: eq(certificates.userId, user.id),
    });

    if (existingCert) {
      return NextResponse.json({
        success: true,
        message: 'You already have a certificate. Check your dashboard!',
        certificate: existingCert,
      });
    }

    // Generate certificate number
    const certificateNumber = `CERT-DEMO-${Date.now().toString(36).toUpperCase()}`;

    // Create certificate
    const [newCertificate] = await database.insert(certificates).values({
      userId: user.id,
      moduleId: module.id,
      certificateNumber,
      completedAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      message: `Demo certificate created for "${module.title}"`,
      certificate: {
        ...newCertificate,
        moduleTitle: module.title,
      },
    });
  } catch (error) {
    console.error('Error creating test certificate:', error);
    return NextResponse.json({ error: 'Failed to create test certificate' }, { status: 500 });
  }
}
