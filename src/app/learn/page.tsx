import { db, learningModules, eq } from '@/lib/db';
import Link from 'next/link';
import { BookOpen, Clock, BarChart3, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  const database = db();

  const modules = await database.query.learningModules.findMany({
    where: eq(learningModules.status, 'published'),
    orderBy: (modules, { asc }) => [asc(modules.orderIndex)],
  });

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Learning Center</h1>
          <p className="text-xl text-primary-100 max-w-2xl">
            Master petroleum engineering with our comprehensive curriculum designed by industry experts.
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {modules.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-surface-400 mb-4" />
            <h2 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
              No modules available yet
            </h2>
            <p className="text-surface-500">
              Check back soon for new learning content!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={`/learn/${module.moduleId}`}
                className="group bg-white dark:bg-surface-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-surface-200 dark:border-surface-700"
              >
                {/* Thumbnail */}
                {module.thumbnailUrl && (
                  <div className="aspect-video bg-surface-200 dark:bg-surface-700 overflow-hidden">
                    <img
                      src={module.thumbnailUrl}
                      alt={module.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    {module.difficultyLevel && (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${difficultyColors[module.difficultyLevel] || 'bg-surface-100 text-surface-800'}`}>
                        {module.difficultyLevel}
                      </span>
                    )}
                    {module.discipline && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                        {module.discipline}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {module.title}
                  </h2>
                  <p className="text-surface-600 dark:text-surface-400 text-sm mb-4 line-clamp-2">
                    {module.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-surface-500 dark:text-surface-400">
                    <div className="flex items-center gap-4">
                      {module.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {module.duration}
                        </span>
                      )}
                      {module.learningObjectives && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {module.learningObjectives.length} objectives
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
