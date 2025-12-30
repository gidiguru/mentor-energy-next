import { db, learningModules } from '@/lib/db';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminModulesPage() {
  const database = db();

  const modules = await database.query.learningModules.findMany({
    orderBy: (m, { asc }) => [asc(m.orderIndex)],
    with: {
      sections: {
        with: {
          pages: true,
        },
      },
    },
  });

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-1 md:mb-2">
            Learning Modules
          </h1>
          <p className="text-sm md:text-base text-surface-600 dark:text-surface-400">
            Manage your course modules and content.
          </p>
        </div>
        <Link
          href="/admin/modules/new"
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-lg transition-all w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add Module
        </Link>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-8 md:p-12 text-center border border-surface-200 dark:border-surface-700">
          <BookOpen className="w-12 h-12 mx-auto text-surface-400 mb-4" />
          <h2 className="text-lg md:text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
            No modules yet
          </h2>
          <p className="text-sm md:text-base text-surface-500 mb-4">
            Create your first learning module or seed sample data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin/modules/new"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create Module
            </Link>
            <span className="text-surface-300 hidden sm:inline">or</span>
            <Link
              href="/admin/seed"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Seed Sample Data
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {modules.map((module) => {
              const totalPages = module.sections.reduce(
                (acc, section) => acc + section.pages.length,
                0
              );

              return (
                <div
                  key={module.id}
                  className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {module.thumbnailUrl ? (
                        <img
                          src={module.thumbnailUrl}
                          alt={module.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-surface-900 dark:text-white truncate">
                          {module.title}
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {module.moduleId}
                        </p>
                        <span className={`inline-flex px-2 py-0.5 mt-1 text-xs font-medium rounded-full ${statusColors[module.status]}`}>
                          {module.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-surface-500 dark:text-surface-400 mb-3">
                      <span>{module.sections.length} sections, {totalPages} pages</span>
                      <span className="capitalize">{module.discipline || '-'}</span>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-surface-200 dark:border-surface-600">
                      <Link
                        href={`/learn/${module.moduleId}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Link
                        href={`/admin/modules/${module.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-50 dark:bg-surface-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Discipline
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                  {modules.map((module) => {
                    const totalPages = module.sections.reduce(
                      (acc, section) => acc + section.pages.length,
                      0
                    );

                    return (
                      <tr key={module.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {module.thumbnailUrl ? (
                              <img
                                src={module.thumbnailUrl}
                                alt={module.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-surface-900 dark:text-white">
                                {module.title}
                              </p>
                              <p className="text-sm text-surface-500 dark:text-surface-400">
                                {module.moduleId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[module.status]}`}>
                            {module.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                          {module.sections.length} sections, {totalPages} pages
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400 capitalize">
                          {module.discipline || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/learn/${module.moduleId}`}
                              className="p-2 text-surface-500 hover:text-primary-600 transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/modules/${module.id}`}
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
          </div>
        </>
      )}
    </div>
  );
}
