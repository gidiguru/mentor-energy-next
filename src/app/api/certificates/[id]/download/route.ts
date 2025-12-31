import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users, certificates, learningModules, eq, and } from '@/lib/db';
import { jsPDF } from 'jspdf';

// GET /api/certificates/[id]/download - Generate PDF certificate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: certificateId } = await params;

    const database = db();
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch certificate with module info
    const certificate = await database.query.certificates.findFirst({
      where: and(
        eq(certificates.id, certificateId),
        eq(certificates.userId, user.id)
      ),
      with: {
        module: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Generate PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Background gradient effect (using rectangles)
    pdf.setFillColor(15, 23, 42); // Dark slate
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative border
    pdf.setDrawColor(220, 38, 38); // Red border
    pdf.setLineWidth(3);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border
    pdf.setDrawColor(185, 28, 28);
    pdf.setLineWidth(1);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Corner decorations
    const cornerSize = 15;
    pdf.setFillColor(220, 38, 38);
    // Top left
    pdf.triangle(10, 10, 10 + cornerSize, 10, 10, 10 + cornerSize, 'F');
    // Top right
    pdf.triangle(pageWidth - 10, 10, pageWidth - 10 - cornerSize, 10, pageWidth - 10, 10 + cornerSize, 'F');
    // Bottom left
    pdf.triangle(10, pageHeight - 10, 10 + cornerSize, pageHeight - 10, 10, pageHeight - 10 - cornerSize, 'F');
    // Bottom right
    pdf.triangle(pageWidth - 10, pageHeight - 10, pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10 - cornerSize, 'F');

    // Logo/Brand text
    pdf.setTextColor(220, 38, 38);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MENTOR ENERGY', pageWidth / 2, 30, { align: 'center' });

    // Certificate title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CERTIFICATE', pageWidth / 2, 55, { align: 'center' });

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.text('OF COMPLETION', pageWidth / 2, 65, { align: 'center' });

    // Decorative line
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 2 - 60, 72, pageWidth / 2 + 60, 72);

    // "This is to certify that"
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(12);
    pdf.text('This is to certify that', pageWidth / 2, 85, { align: 'center' });

    // Recipient name
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student';
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fullName, pageWidth / 2, 100, { align: 'center' });

    // Decorative line under name
    const nameWidth = pdf.getTextWidth(fullName);
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 2 - nameWidth / 2 - 10, 105, pageWidth / 2 + nameWidth / 2 + 10, 105);

    // "has successfully completed"
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('has successfully completed the course', pageWidth / 2, 118, { align: 'center' });

    // Course title
    const moduleTitle = certificate.module?.title || 'Course';
    pdf.setTextColor(220, 38, 38);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');

    // Handle long titles
    const maxTitleWidth = pageWidth - 80;
    const titleLines = pdf.splitTextToSize(moduleTitle, maxTitleWidth);
    pdf.text(titleLines, pageWidth / 2, 132, { align: 'center' });

    // Certificate details section
    const detailsY = 155;

    // Certificate number
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Certificate No: ${certificate.certificateNumber}`, 30, detailsY);

    // Issue date
    const completedDate = new Date(certificate.completedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    pdf.text(`Issued: ${completedDate}`, pageWidth - 30, detailsY, { align: 'right' });

    // Signature line
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.3);
    pdf.line(pageWidth / 2 - 40, 172, pageWidth / 2 + 40, 172);

    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(10);
    pdf.text('Mentor Energy Team', pageWidth / 2, 178, { align: 'center' });

    // Verification URL
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.text(`Verify at: mentor.energy/verify/${certificate.certificateNumber}`, pageWidth / 2, pageHeight - 18, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = pdf.output('arraybuffer');

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
