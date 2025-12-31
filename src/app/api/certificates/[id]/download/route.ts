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

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative border
    pdf.setDrawColor(220, 38, 38); // Red border
    pdf.setLineWidth(2);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border (subtle gray)
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.5);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Logo - Diamond shape (similar to m.e logo)
    const logoX = pageWidth / 2 - 35;
    const logoY = 28;
    const logoSize = 6;

    // Draw diamond logo (4 small diamonds arranged)
    pdf.setFillColor(220, 38, 38);
    // Top diamond
    pdf.triangle(logoX, logoY - logoSize, logoX - logoSize/2, logoY - logoSize/2, logoX + logoSize/2, logoY - logoSize/2, 'F');
    pdf.triangle(logoX, logoY, logoX - logoSize/2, logoY - logoSize/2, logoX + logoSize/2, logoY - logoSize/2, 'F');
    // Bottom left diamond
    pdf.triangle(logoX - logoSize/2, logoY + logoSize/2, logoX - logoSize, logoY, logoX, logoY, 'F');
    pdf.triangle(logoX - logoSize/2, logoY + logoSize/2, logoX - logoSize, logoY + logoSize, logoX, logoY + logoSize, 'F');
    // Bottom right diamond
    pdf.triangle(logoX + logoSize/2, logoY + logoSize/2, logoX, logoY, logoX + logoSize, logoY, 'F');
    pdf.triangle(logoX + logoSize/2, logoY + logoSize/2, logoX, logoY + logoSize, logoX + logoSize, logoY + logoSize, 'F');

    // Brand text "mentor.energy"
    pdf.setTextColor(220, 38, 38);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('mentor.energy', logoX + 12, logoY + 2);

    // Certificate title
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CERTIFICATE', pageWidth / 2, 55, { align: 'center' });

    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('OF COMPLETION', pageWidth / 2, 65, { align: 'center' });

    // Decorative line
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.8);
    pdf.line(pageWidth / 2 - 50, 72, pageWidth / 2 + 50, 72);

    // "This is to certify that"
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(12);
    pdf.text('This is to certify that', pageWidth / 2, 88, { align: 'center' });

    // Recipient name
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student';
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fullName, pageWidth / 2, 105, { align: 'center' });

    // Decorative line under name
    const nameWidth = pdf.getTextWidth(fullName);
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 2 - nameWidth / 2 - 10, 110, pageWidth / 2 + nameWidth / 2 + 10, 110);

    // "has successfully completed"
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('has successfully completed the course', pageWidth / 2, 122, { align: 'center' });

    // Course title
    const moduleTitle = certificate.module?.title || 'Course';
    pdf.setTextColor(220, 38, 38);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');

    // Handle long titles
    const maxTitleWidth = pageWidth - 80;
    const titleLines = pdf.splitTextToSize(moduleTitle, maxTitleWidth);
    pdf.text(titleLines, pageWidth / 2, 136, { align: 'center' });

    // Certificate details section
    const detailsY = 160;

    // Certificate number
    pdf.setTextColor(120, 120, 120);
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
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(pageWidth / 2 - 40, 175, pageWidth / 2 + 40, 175);

    pdf.setTextColor(220, 38, 38);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('mentor.energy', pageWidth / 2, 181, { align: 'center' });

    // Verification URL
    pdf.setTextColor(150, 150, 150);
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
