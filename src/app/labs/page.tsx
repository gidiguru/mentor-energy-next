import { db, learningModules, moduleSections, sectionPages, eq } from '@/lib/db';
import Link from 'next/link';
import { FlaskConical, Clock, ChevronRight, BookOpen, Target } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface LabConfig {
  labType: 'simulation' | 'interactive' | 'sandbox' | 'guided';
  labUrl?: string;
  instructions: string[];
  objectives: string[];
  tools?: string[];
  timeLimit?: number;
}

interface LabPage {
  id: string;
  title: string;
  estimatedDuration: string | null;
  labConfig: LabConfig | null;
  section: {
    id: string;
    title: string;
    module: {
      moduleId: string;
      title: string;
    };
  };
}

export default async function LabsPage() {
  const database = db();

  // Fetch all published modules with their sections and lab pages
  const modules = await database.query.learningModules.findMany({
    where: eq(learningModules.status, 'published'),
    with: {
      sections: {
        orderBy: (sections, { asc }) => [asc(sections.sequence)],
        with: {
          pages: {
            orderBy: (pages, { asc }) => [asc(pages.sequence)],
          },
        },
      },
    },
  });

  // Extract all lab pages
  const labs: LabPage[] = [];
  for (const module of modules) {
    for (const section of module.sections) {
      for (const page of section.pages) {
        if (page.pageType === 'lab' && page.labConfig) {
          labs.push({
            id: page.id,
            title: page.title,
            estimatedDuration: page.estimatedDuration,
            labConfig: page.labConfig as LabConfig,
            section: {
              id: section.id,
              title: section.title,
              module: {
                moduleId: module.moduleId,
                title: module.title,
              },
            },
          });
        }
      }
    }
  }

  const labTypeLabels: Record<string, { label: string; color: string }> = {
    simulation: { label: 'Simulation', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    interactive: { label: 'Interactive', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    sandbox: { label: 'Sandbox', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    guided: { label: 'Guided Lab', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
                Virtual Labs
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Hands-on practice environments for practical learning
              </p>
            </div>
          </div>
        </div>

        {/* Labs Grid */}
        {labs.length === 0 ? (
          <div className="text-center py-16">
            <FlaskConical className="w-16 h-16 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              No Labs Available Yet
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Virtual labs will appear here once they are added to courses.
            </p>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => {
              const labType = lab.labConfig?.labType || 'guided';
              const typeInfo = labTypeLabels[labType] || labTypeLabels.guided;

              return (
                <Link
                  key={lab.id}
                  href={`/learn/${lab.section.module.moduleId}/${lab.section.id}/${lab.id}`}
                  className="group bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden hover:border-primary-300 dark:hover:border-primary-600 transition-all hover:shadow-lg"
                >
                  {/* Lab Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-white" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      {lab.labConfig?.timeLimit && (
                        <span className="text-xs text-white/80 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lab.labConfig.timeLimit} min
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mt-2 line-clamp-2">
                      {lab.title}
                    </h3>
                  </div>

                  {/* Lab Body */}
                  <div className="p-4">
                    {/* Course Info */}
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
                      {lab.section.module.title} → {lab.section.title}
                    </p>

                    {/* Objectives Preview */}
                    {lab.labConfig?.objectives && lab.labConfig.objectives.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">
                          <Target className="w-3 h-3" />
                          Objectives
                        </div>
                        <ul className="space-y-1">
                          {lab.labConfig.objectives.slice(0, 2).map((objective, index) => (
                            <li key={index} className="text-sm text-surface-600 dark:text-surface-300 line-clamp-1">
                              • {objective}
                            </li>
                          ))}
                          {lab.labConfig.objectives.length > 2 && (
                            <li className="text-xs text-surface-400">
                              +{lab.labConfig.objectives.length - 2} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Tools */}
                    {lab.labConfig?.tools && lab.labConfig.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lab.labConfig.tools.slice(0, 3).map((tool, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded text-surface-600 dark:text-surface-400"
                          >
                            {tool}
                          </span>
                        ))}
                        {lab.labConfig.tools.length > 3 && (
                          <span className="text-xs text-surface-400">
                            +{lab.labConfig.tools.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-surface-50 dark:bg-surface-700/50 border-t border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-600 dark:text-surface-400">
                        {lab.labConfig?.instructions?.length || 0} steps
                      </span>
                      <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700 flex items-center gap-1">
                        Start Lab
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
