import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { listR2Files, deleteFromR2, isR2Configured } from '@/lib/r2';

// GET - List all files in R2 bucket
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 storage not configured' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const files = await listR2Files(category);

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    console.error('Error listing media:', error);
    return NextResponse.json(
      { error: 'Failed to list media files' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a file from R2
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 storage not configured' },
      { status: 503 }
    );
  }

  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    const success = await deleteFromR2(key);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}
