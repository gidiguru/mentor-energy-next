import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 configuration
// R2 is S3-compatible, so we use the AWS SDK
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mentor-energy-content';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: Custom domain or R2.dev URL

// Create S3 client configured for R2
export function getR2Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn('R2 credentials not configured');
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// File type configurations
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif'],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',      // MOV files
    'video/x-m4v',          // iPhone M4V
    'video/3gpp',           // 3GP (older phones)
    'video/3gpp2',          // 3G2
    'video/x-msvideo',      // AVI
    'video/mpeg',           // MPEG
    'video/x-matroska',     // MKV
  ],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac'],
};

// Map file extensions to MIME types (for mobile where type may be empty)
const EXTENSION_TO_MIME: Record<string, string> = {
  // Video
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/x-m4v',
  '3gp': 'video/3gpp',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  // Image
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  // Document
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Get MIME type from file extension (for mobile uploads where type may be missing)
export function getMimeTypeFromExtension(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext && EXTENSION_TO_MIME[ext]) {
    return EXTENSION_TO_MIME[ext];
  }
  return null;
}

// Get or detect MIME type - uses provided type or falls back to extension detection
export function getOrDetectMimeType(providedType: string | undefined, fileName: string): string {
  // If we have a valid MIME type, use it
  if (providedType && providedType !== '' && providedType !== 'application/octet-stream') {
    return providedType;
  }
  // Fallback to extension detection
  return getMimeTypeFromExtension(fileName) || 'application/octet-stream';
}

export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,      // 10MB
  video: 500 * 1024 * 1024,     // 500MB
  document: 50 * 1024 * 1024,   // 50MB
  audio: 100 * 1024 * 1024,     // 100MB
};

// Get file type category from MIME type
export function getFileCategory(mimeType: string): keyof typeof ALLOWED_FILE_TYPES | null {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category as keyof typeof ALLOWED_FILE_TYPES;
    }
  }
  return null;
}

// Generate a unique file path
export function generateFilePath(category: string, originalName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const safeName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
    .substring(0, 50); // Limit length

  return `${category}/${timestamp}-${randomId}-${safeName}.${extension}`;
}

// Upload file to R2
export async function uploadToR2(
  file: Buffer,
  filePath: string,
  contentType: string
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
        Body: file,
        ContentType: contentType,
      })
    );

    // Return public URL
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL}/${filePath}`;
    }

    // Default R2.dev URL format
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${filePath}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    return null;
  }
}

// Delete file from R2
export async function deleteFromR2(filePath: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
      })
    );
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

// Generate a presigned URL for direct upload (client-side upload)
export async function getPresignedUploadUrl(
  filePath: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
      ContentType: contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Presigned URL error:', error);
    return null;
  }
}

// Generate a presigned URL for downloading (private files)
export async function getPresignedDownloadUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Presigned download URL error:', error);
    return null;
  }
}

// Check if R2 is configured
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

// Get public URL for a file path
export function getPublicUrl(filePath: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${filePath}`;
  }
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${filePath}`;
}

// List all files in the bucket
export interface R2File {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
  category: string;
}

export async function listR2Files(prefix?: string): Promise<R2File[]> {
  const client = getR2Client();
  if (!client) return [];

  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await client.send(command);
    const files: R2File[] = [];

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.Size !== undefined && obj.LastModified) {
          // Determine category from the path prefix
          const category = obj.Key.split('/')[0] || 'other';

          files.push({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            url: getPublicUrl(obj.Key),
            category,
          });
        }
      }
    }

    // Sort by most recent first
    files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    return files;
  } catch (error) {
    console.error('R2 list error:', error);
    return [];
  }
}
