'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Trash2,
  Image,
  Video,
  FileText,
  Music,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface MediaFile {
  key: string;
  size: number;
  lastModified: string;
  url: string;
  category: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  document: FileText,
  audio: Music,
};

const categoryColors: Record<string, string> = {
  image: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  video: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  document: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  audio: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = filter === 'all' ? '/api/admin/media' : `/api/admin/media?category=${filter}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load media');
      }

      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [filter]);

  const handleDelete = async (key: string) => {
    setDeleting(key);
    setError(null);

    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }

      setFiles(files.filter((f) => f.key !== key));
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const filteredFiles = files;
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const categoryStats = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
              Media Library
            </h1>
            <p className="text-sm md:text-base text-surface-600 dark:text-surface-400 mt-1">
              Manage uploaded files
            </p>
          </div>
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-3 md:p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-xs md:text-sm text-surface-500">Files</p>
          <p className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white">{files.length}</p>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-3 md:p-4 border border-surface-200 dark:border-surface-700">
          <p className="text-xs md:text-sm text-surface-500">Storage</p>
          <p className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white">{formatFileSize(totalSize)}</p>
        </div>
        {Object.entries(categoryStats).slice(0, 3).map(([cat, count]) => {
          const Icon = categoryIcons[cat] || FileText;
          return (
            <div key={cat} className="bg-white dark:bg-surface-800 rounded-xl p-3 md:p-4 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-surface-400" />
                <p className="text-xs md:text-sm text-surface-500 capitalize">{cat}s</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters - Horizontal scroll on mobile */}
      <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap">
          {['all', 'image', 'video', 'document', 'audio'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredFiles.length === 0 && (
        <div className="text-center py-16 md:py-20 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
            <Image className="w-7 h-7 md:w-8 md:h-8 text-surface-400" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-surface-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-sm text-surface-500">
            {filter === 'all' ? 'Upload your first file' : `No ${filter} files`}
          </p>
        </div>
      )}

      {/* File Grid */}
      {!loading && filteredFiles.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const Icon = categoryIcons[file.category] || FileText;
            const colorClass = categoryColors[file.category] || 'bg-gray-100 text-gray-600';
            const fileName = file.key.split('/').pop() || file.key;

            return (
              <div
                key={file.key}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
              >
                {/* Preview */}
                <div className="aspect-video bg-surface-100 dark:bg-surface-700 relative">
                  {file.category === 'image' ? (
                    <img
                      src={file.url}
                      alt={fileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : file.category === 'video' ? (
                    <video
                      src={file.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-12 h-12 text-surface-400" />
                    </div>
                  )}

                  {/* Category badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                    {file.category}
                  </div>
                </div>

                {/* File info */}
                <div className="p-3">
                  <p className="font-medium text-surface-900 dark:text-white text-sm truncate" title={fileName}>
                    {fileName}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-xs text-surface-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.lastModified)}</span>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-600">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 text-sm font-medium transition-colors active:scale-[0.98]"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </a>
                    <button
                      onClick={() => setConfirmDelete(file.key)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium transition-colors active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white dark:bg-surface-800 rounded-t-2xl sm:rounded-xl p-6 w-full sm:max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              Delete File?
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-4 text-sm">
              This action cannot be undone.
            </p>
            <p className="text-xs text-surface-500 mb-6 font-mono bg-surface-100 dark:bg-surface-700 p-2 rounded truncate">
              {confirmDelete.split('/').pop()}
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting === confirmDelete}
                className="px-4 py-3 sm:py-2 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold transition-colors"
              >
                {deleting === confirmDelete ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
