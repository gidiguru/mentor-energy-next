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
  Copy,
  Check,
  HardDrive,
  FolderOpen,
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
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL');
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const categoryStats = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
          Media Library
        </h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          Manage uploaded files
        </p>
      </div>

      {/* Stats Cards */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 mb-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
          Storage Overview
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{files.length}</p>
              <p className="text-xs text-surface-500">Total Files</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{formatFileSize(totalSize)}</p>
              <p className="text-xs text-surface-500">Storage Used</p>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(categoryStats).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            {Object.entries(categoryStats).map(([cat, count]) => {
              const Icon = categoryIcons[cat] || FileText;
              return (
                <div key={cat} className="flex items-center gap-2 p-2">
                  <Icon className="w-4 h-4 text-surface-400" />
                  <span className="text-sm text-surface-600 dark:text-surface-400 capitalize">{cat}s:</span>
                  <span className="text-sm font-semibold text-surface-900 dark:text-white">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters & Refresh */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'image', 'video', 'document', 'audio'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1) + 's'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 border border-surface-200 dark:border-surface-700 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && files.length === 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 border border-surface-200 dark:border-surface-700 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
            <Image className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-surface-500">
            {filter === 'all' ? 'Upload your first file to get started' : `No ${filter} files uploaded yet`}
          </p>
        </div>
      )}

      {/* File List */}
      {!loading && files.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              Files ({files.length})
            </h2>
          </div>
          <div className="divide-y divide-surface-200 dark:divide-surface-700">
            {files.map((file) => {
              const Icon = categoryIcons[file.category] || FileText;
              const colorClass = categoryColors[file.category] || 'bg-gray-100 text-gray-600';
              const fileName = file.key.split('/').pop() || file.key;

              return (
                <div key={file.key} className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg bg-surface-100 dark:bg-surface-700 overflow-hidden">
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
                          <Icon className="w-8 h-8 text-surface-400" />
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-surface-900 dark:text-white text-sm md:text-base truncate" title={fileName}>
                          {fileName}
                        </p>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                          {file.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs md:text-sm text-surface-500 mb-3">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.lastModified)}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => copyUrl(file.url)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                        >
                          {copiedUrl === file.url ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy URL
                            </>
                          )}
                        </button>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </a>
                        <button
                          onClick={() => setConfirmDelete(file.key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                Delete File?
              </h3>
            </div>
            <p className="text-surface-600 dark:text-surface-400 mb-4 text-sm">
              This action cannot be undone. The file will be permanently deleted.
            </p>
            <p className="text-xs text-surface-500 mb-6 font-mono bg-surface-100 dark:bg-surface-700 p-3 rounded-lg truncate">
              {confirmDelete.split('/').pop()}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting === confirmDelete}
                className="px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold transition-colors"
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
