import { db, resources } from '@/lib/db';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, FileText, Video, File, ExternalLink, Lock } from 'lucide-react';

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
            Resources
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage articles, videos, and documents.
          </p>
        </div>
        <Link
          href="/admin/resources/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </Link>
      </div>

      {allResources.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
          <FileText className="w-12 h-12 mx-auto text-surface-400 mb-4" />
          <h2 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
            No resources yet
          </h2>
          <p className="text-surface-500 mb-4">
            Add your first resource or seed sample data.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/admin/resources/new"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Add Resource
            </Link>
            <span className="text-surface-300">or</span>
            <Link
              href="/admin/seed"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Seed Sample Data
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50 dark:bg-surface-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {allResources.map((resource) => {
                const Icon = typeIcons[resource.type] || FileText;

                return (
                  <tr key={resource.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">
                            {resource.title}
                          </p>
                          <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-1">
                            {resource.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-surface-100 dark:bg-surface-600 text-surface-700 dark:text-surface-300 capitalize">
                        {resource.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                      {resource.category || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {resource.isPublished ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                            Draft
                          </span>
                        )}
                        {resource.isPremium && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                            <Lock className="w-3 h-3" />
                            Premium
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {resource.url && resource.url !== '#' && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-surface-500 hover:text-primary-600 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/resources/${resource.id}`}
                          className="p-2 text-surface-500 hover:text-primary-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-2 text-surface-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
