import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  uploadToR2,
  getFileCategory,
  generateFilePath,
  MAX_FILE_SIZES,
  ALLOWED_FILE_TYPES,
  isR2Configured,
} from '@/lib/r2';

export async function POST(request: NextRequest) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if R2 is configured
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'File storage not configured. Please set up Cloudflare R2 credentials.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const category = getFileCategory(file.type);
    if (!category) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[category];
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size for ${category}: ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Generate file path
    const filePath = generateFilePath(category, file.name);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const url = await uploadToR2(buffer, filePath, file.type);

    if (!url) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      path: filePath,
      name: file.name,
      type: file.type,
      size: file.size,
      category,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// Get presigned URL for direct upload (for large files)
export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'File storage not configured' },
      { status: 503 }
    );
  }

  try {
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    const category = getFileCategory(contentType);
    if (!category) {
      return NextResponse.json(
        { error: `File type not allowed: ${contentType}` },
        { status: 400 }
      );
    }

    const filePath = generateFilePath(category, fileName);

    // Import dynamically to avoid issues if not configured
    const { getPresignedUploadUrl } = await import('@/lib/r2');
    const presignedUrl = await getPresignedUploadUrl(filePath, contentType);

    if (!presignedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      );
    }

    // Calculate the public URL
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mentor-energy-content';

    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${filePath}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${filePath}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      path: filePath,
      category,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
