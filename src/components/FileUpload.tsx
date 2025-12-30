'use client';

import { useState, useRef, useCallback } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const uploadFile = async (file: File) => {
    setError(null);

    // Validate file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    setIsUploading(true);

    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
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
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
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
