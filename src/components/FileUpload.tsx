'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, Video, Image, Music, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedFile {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
  category: string;
}

interface FileUploadProps {
  onUpload: (file: UploadedFile) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  hint?: string;
  currentUrl?: string;
}

const categoryIcons = {
  image: Image,
  video: Video,
  document: FileText,
  audio: Music,
};

export default function FileUpload({
  onUpload,
  accept = 'image/*,video/*,application/pdf',
  maxSize = 100 * 1024 * 1024, // 100MB default
  label = 'Upload File',
  hint = 'Drag and drop or click to upload',
  currentUrl,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect iOS/mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      setIsMobile(isIOS || isAndroid);
    };
    checkMobile();
  }, []);

  // On iOS, accept="video/*" greys out photo library
  // Use permissive accept on mobile to allow all media selection
  const mobileAccept = isMobile ? '*/*' : accept;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Threshold for using presigned URLs (4MB - under Netlify's limit)
  const PRESIGNED_THRESHOLD = 4 * 1024 * 1024;

  // Allowed file types for validation
  const allowedTypes: Record<string, string[]> = {
    'image/*': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif'],
    'video/*': ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v', 'video/3gpp', 'video/3gpp2', 'video/x-msvideo', 'video/mpeg', 'video/x-matroska'],
    'application/pdf': ['application/pdf'],
    'audio/*': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac'],
  };

  const isFileTypeAllowed = (file: File): boolean => {
    // If file has no type (common on iOS), check by extension
    if (!file.type || file.type === '') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const videoExts = ['mp4', 'mov', 'webm', 'm4v', '3gp', 'avi', 'mkv'];
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
      const docExts = ['pdf'];
      const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

      if (ext && [...videoExts, ...imageExts, ...docExts, ...audioExts].includes(ext)) {
        return true;
      }
    }

    // If accept is permissive or on mobile, check against all allowed types
    if (accept === '*/*' || isMobile) {
      const allAllowed = Object.values(allowedTypes).flat();
      // Also check if it starts with a valid category prefix
      if (file.type.startsWith('video/') || file.type.startsWith('image/') ||
          file.type.startsWith('audio/') || file.type === 'application/pdf') {
        return true;
      }
      return allAllowed.some(type => file.type === type);
    }

    // Check against specified accept types
    const acceptTypes = accept.split(',').map(t => t.trim());
    for (const acceptType of acceptTypes) {
      if (acceptType.endsWith('/*')) {
        const category = acceptType.replace('/*', '');
        if (file.type.startsWith(category + '/')) return true;
      } else if (file.type === acceptType) {
        return true;
      }
    }
    return false;
  };

  const uploadFile = async (file: File) => {
    setError(null);

    // Validate file type (especially important on mobile where we allow */*)
    if (!isFileTypeAllowed(file)) {
      setError(`File type not supported: ${file.type || 'unknown'}. Please select an image, video, or document.`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Use presigned URL for large files (videos, etc.)
      if (file.size > PRESIGNED_THRESHOLD) {
        await uploadWithPresignedUrl(file);
      } else {
        await uploadWithFormData(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadWithFormData = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    setUploadedFile(data);
    onUpload(data);
  };

  const uploadWithPresignedUrl = async (file: File) => {
    // Step 1: Get presigned URL from server
    const presignedResponse = await fetch('/api/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    const presignedData = await presignedResponse.json();

    if (!presignedResponse.ok) {
      throw new Error(presignedData.error || 'Failed to get upload URL');
    }

    // Step 2: Upload directly to R2 using presigned URL
    const uploadResponse = await fetch(presignedData.presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage');
    }

    // Step 3: Return the public URL
    const uploadedData = {
      url: presignedData.publicUrl,
      path: presignedData.path,
      name: file.name,
      type: file.type,
      size: file.size,
      category: presignedData.category,
    };

    setUploadedFile(uploadedData);
    onUpload(uploadedData);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = uploadedFile?.url || currentUrl;
  const displayCategory = uploadedFile?.category || (currentUrl ? 'image' : null);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
        {label}
      </label>

      {displayUrl ? (
        <div className="relative rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
          {/* Preview */}
          {displayCategory === 'image' && (
            <img
              src={displayUrl}
              alt="Uploaded file"
              className="w-full h-48 object-cover"
            />
          )}
          {displayCategory === 'video' && (
            <video
              src={displayUrl}
              className="w-full h-48 object-cover"
              controls
            />
          )}
          {(displayCategory === 'document' || displayCategory === 'audio') && (
            <div className="w-full h-48 bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
              {displayCategory === 'document' ? (
                <FileText className="w-16 h-16 text-surface-400" />
              ) : (
                <Music className="w-16 h-16 text-surface-400" />
              )}
            </div>
          )}

          {/* Overlay with file info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="text-white text-sm truncate flex-1">
                {uploadedFile?.name || 'Current file'}
              </div>
              <button
                onClick={clearUpload}
                className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors ml-2"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={mobileAccept}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
              <p className="text-surface-600 dark:text-surface-400">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-10 h-10 text-surface-400 mb-3" />
              <p className="text-surface-700 dark:text-surface-300 font-medium">{hint}</p>
              <p className="text-sm text-surface-500 mt-1">
                Max size: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {uploadedFile && !error && (
        <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          File uploaded successfully
        </div>
      )}
    </div>
  );
}
