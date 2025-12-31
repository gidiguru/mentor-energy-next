import { db, resources } from '@/lib/db';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, FileText, Video, File, ExternalLink, Lock, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminResourcesPage() {
  const database = db();

  const allResources = await database.query.resources.findMany({
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const typeIcons: Record<string, typeof FileText> = {
    article: FileText,
    video: Video,
    document: File,
    link: ExternalLink,
  };

  const typeColors: Record<string, string> = {
    article: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    video: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    document: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    link: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  };

  // Stats
  const publishedCount = allResources.filter(r => r.isPublished).length;
  const draftCount = allResources.filter(r => !r.isPublished).length;
  const premiumCount = allResources.filter(r => r.isPremium).length;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
              Resources
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              Manage articles, videos, and documents
            </p>
          </div>
          <Link
            href="/admin/resources/new"
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 mb-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{allResources.length}</p>
            <p className="text-xs text-surface-500">Total Resources</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{publishedCount}</p>
            <p className="text-xs text-surface-500">Published</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{draftCount}</p>
            <p className="text-xs text-surface-500">Drafts</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{premiumCount}</p>
            <p className="text-xs text-surface-500">Premium</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {allResources.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-surface-400" />
          </div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
            No resources yet
          </h2>
          <p className="text-surface-500 mb-6">
            Add your first resource or seed sample data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin/resources/new"
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Add Resource
            </Link>
            <Link
              href="/admin/seed"
              className="w-full sm:w-auto px-4 py-2 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-lg transition-colors"
            >
              Seed Sample Data
            </Link>
          </div>
        </div>
      ) : (
        /* Resource List */
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              All Resources ({allResources.length})
            </h2>
          </div>
          <div className="divide-y divide-surface-200 dark:divide-surface-700">
            {allResources.map((resource) => {
              const Icon = typeIcons[resource.type] || FileText;
              const colorClass = typeColors[resource.type] || 'bg-gray-100 text-gray-600';

              return (
                <div key={resource.id} className="p-4">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-surface-900 dark:text-white text-sm md:text-base line-clamp-1">
                          {resource.title}
                        </p>
                      </div>

                      {resource.description && (
                        <p className="text-sm text-surface-500 line-clamp-2 mb-2">
                          {resource.description}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                          {resource.type}
                        </span>
                        {resource.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-600 text-surface-600 dark:text-surface-300">
                            {resource.category}
                          </span>
                        )}
                        {resource.isPublished ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                            Draft
                          </span>
                        )}
                        {resource.isPremium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            <Lock className="w-3 h-3" />
                            Premium
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {resource.url && resource.url !== '#' && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </a>
                        )}
                        <Link
                          href={`/admin/resources/${resource.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                        <button
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
    </div>
  );
}
