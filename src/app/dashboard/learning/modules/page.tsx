import { db, learningModules, eq } from '@/lib/db';
import Link from 'next/link';
import { Clock, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ModulesPage() {
  const database = db();

  const modules = await database.query.learningModules.findMany({
    where: eq(learningModules.status, 'published'),
    orderBy: (modules, { asc }) => [asc(modules.orderIndex)],
    with: {
      sections: {
        with: {
          pages: true,
        },
      },
    },
  });

  const getDifficultyColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-surface-500/10 text-surface-500';
    }
  };

  const getTotalLessons = (module: typeof modules[0]) => {
    return module.sections?.reduce((acc, section) => acc + (section.pages?.length || 0), 0) || 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h2 mb-2">Learning Modules</h1>
        <p className="text-surface-600 dark:text-surface-400">
          Start your learning journey with our comprehensive modules
        </p>
      </div>

      {modules.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <div className="text-lg text-surface-500">No modules available yet</div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {modules.map((module) => (
            <div key={module.id} className="card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10 text-2xl">
                  📖
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyColor(
                    module.difficultyLevel
                  )}`}
                >
                  {module.difficultyLevel || 'All Levels'}
                </span>
              </div>

              <h3 className="h3 mb-2">{module.title}</h3>
              <p className="mb-4 text-sm text-surface-600 dark:text-surface-400">
                {module.description}
              </p>

              <div className="mb-4 flex items-center gap-4 text-sm text-surface-500">
                {module.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{module.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{module.sections?.length || 0} sections</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{getTotalLessons(module)} lessons</span>
                </div>
              </div>

              {/* Progress bar placeholder */}
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>0%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
                  <div className="h-full w-0 rounded-full bg-primary-500" />
                </div>
              </div>

              <Link
                href={`/learn/${module.moduleId}`}
                className="btn btn-primary w-full"
              >
                Start Learning
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
