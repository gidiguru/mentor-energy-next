import Link from 'next/link';
import { db, resources, eq } from '@/lib/db';
import { FileText, Video, File, Link as LinkIcon, Lock, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const database = db();

  const allResources = await database.query.resources.findMany({
    where: eq(resources.isPublished, true),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  // Group by category
  const categories = allResources.reduce((acc, resource) => {
    const category = resource.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(resource);
    return acc;
  }, {} as Record<string, typeof allResources>);

  const categoryList = [
    { name: 'All Resources', count: allResources.length },
    ...Object.entries(categories).map(([name, items]) => ({
      name,
      count: items.length,
    })),
  ];

  const typeIcons: Record<string, typeof FileText> = {
    article: FileText,
    video: Video,
    document: File,
    link: LinkIcon,
  };

  const typeColors: Record<string, string> = {
    article: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    video: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    document: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    link: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
          <p className="text-lg text-primary-100">
            Access our curated collection of articles, videos, guides, and industry reports.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 sticky top-4">
              <h2 className="mb-4 font-semibold text-surface-900 dark:text-white">Categories</h2>
              <ul className="space-y-1">
                {categoryList.map((category) => (
                  <li key={category.name}>
                    <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300">
                      <span>{category.name}</span>
                      <span className="rounded-full bg-surface-200 dark:bg-surface-600 px-2 py-0.5 text-xs">
                        {category.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Resources Grid */}
          <main className="lg:col-span-3">
            {allResources.length === 0 ? (
              <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center border border-surface-200 dark:border-surface-700">
                <FileText className="w-12 h-12 mx-auto text-surface-400 mb-4" />
                <h2 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  No resources available yet
                </h2>
                <p className="text-surface-500">
                  Check back soon for new content!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {allResources.map((resource) => {
                  const Icon = typeIcons[resource.type] || FileText;
                  const colorClass = typeColors[resource.type] || 'bg-surface-100 text-surface-600';

                  return (
                    <div
                      key={resource.id}
                      className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {resource.isPremium && (
                            <span className="flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900 px-2 py-1 text-xs text-yellow-700 dark:text-yellow-300">
                              <Lock className="w-3 h-3" />
                              Premium
                            </span>
                          )}
                          <span className="rounded-full bg-primary-100 dark:bg-primary-900 px-2 py-1 text-xs text-primary-700 dark:text-primary-300 capitalize">
                            {resource.type}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 line-clamp-2">
                        {resource.description}
                      </p>

                      {resource.category && (
                        <span className="inline-block text-xs text-surface-500 dark:text-surface-400 mb-4">
                          {resource.category}
                        </span>
                      )}

                      {resource.url && resource.url !== '#' ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          View Resource
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : resource.content ? (
                        <Link
                          href={`/resources/${resource.id}`}
                          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          Read More →
                        </Link>
                      ) : (
                        <span className="text-sm text-surface-400">Coming soon</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
