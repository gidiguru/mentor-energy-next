import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, certificates, learningModules, userPageProgress, moduleSections, sectionPages, eq, and, inArray } from '@/lib/db';

// GET /api/certificates - Get user's certificates or check if module is complete
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (moduleId) {
      // Check if certificate exists for specific module
      const module = await database.query.learningModules.findFirst({
        where: eq(learningModules.id, moduleId),
      });

      if (!module) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }

      const certificate = await database.query.certificates.findFirst({
        where: and(
          eq(certificates.userId, user.id),
          eq(certificates.moduleId, moduleId),
        ),
      });

      // Check completion status
      const sections = await database.query.moduleSections.findMany({
        where: eq(moduleSections.moduleId, moduleId),
        with: {
          pages: true,
        },
      });

      const allPageIds = sections.flatMap(s => s.pages.map(p => p.id));
      const completedPages = await database.query.userPageProgress.findMany({
        where: and(
          eq(userPageProgress.userId, user.id),
          inArray(userPageProgress.pageId, allPageIds),
          eq(userPageProgress.isCompleted, true),
        ),
      });

      const isComplete = allPageIds.length > 0 && completedPages.length === allPageIds.length;

      return NextResponse.json({
        certificate,
        isComplete,
        completedCount: completedPages.length,
        totalCount: allPageIds.length,
        module: {
          id: module.id,
          title: module.title,
        },
      });
    }

    // Get all user's certificates
    const userCertificates = await database.query.certificates.findMany({
      where: eq(certificates.userId, user.id),
      with: {
        module: true,
      },
      orderBy: (certs, { desc }) => [desc(certs.completedAt)],
    });

    return NextResponse.json({ certificates: userCertificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

// POST /api/certificates - Generate a certificate for completed module
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId } = body;

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if certificate already exists
    const existingCert = await database.query.certificates.findFirst({
      where: and(
        eq(certificates.userId, user.id),
        eq(certificates.moduleId, moduleId),
      ),
    });

    if (existingCert) {
      return NextResponse.json({ certificate: existingCert, message: 'Certificate already exists' });
    }

    // Verify module completion
    const sections = await database.query.moduleSections.findMany({
      where: eq(moduleSections.moduleId, moduleId),
      with: {
        pages: true,
      },
    });

    const allPageIds = sections.flatMap(s => s.pages.map(p => p.id));

    if (allPageIds.length === 0) {
      return NextResponse.json({ error: 'Module has no lessons' }, { status: 400 });
    }

    const completedPages = await database.query.userPageProgress.findMany({
      where: and(
        eq(userPageProgress.userId, user.id),
        inArray(userPageProgress.pageId, allPageIds),
        eq(userPageProgress.isCompleted, true),
      ),
    });

    if (completedPages.length !== allPageIds.length) {
      return NextResponse.json({
        error: 'Module not complete',
        completedCount: completedPages.length,
        totalCount: allPageIds.length,
      }, { status: 400 });
    }

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create certificate
    const [newCertificate] = await database.insert(certificates).values({
      userId: user.id,
      moduleId,
      certificateNumber,
      completedAt: new Date(),
    }).returning();

    // Fetch with module info
    const certificate = await database.query.certificates.findFirst({
      where: eq(certificates.id, newCertificate.id),
      with: {
        module: true,
      },
    });

    return NextResponse.json({ certificate, message: 'Certificate generated successfully' });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
