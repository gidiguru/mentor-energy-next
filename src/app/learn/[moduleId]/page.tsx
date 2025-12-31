import { auth } from '@clerk/nextjs/server';
import { db, learningModules, moduleSections, sectionPages, lessonRatings, userPageProgress, users, eq, inArray, and } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, PlayCircle, FileText, HelpCircle, ChevronRight, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ moduleId: string }>;
}

export default async function ModuleDetailPage({ params }: Props) {
  const { moduleId } = await params;
  const database = db();
  const { userId: clerkId } = await auth();

  // Fetch module with sections
  const module = await database.query.learningModules.findFirst({
    where: eq(learningModules.moduleId, moduleId),
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

  if (!module) {
    notFound();
  }

  // Get all page IDs for this module
  const allPageIds = module.sections.flatMap(s => s.pages.map(p => p.id));

  // Fetch user progress if logged in
  let userProgress: Record<string, { isCompleted: boolean; isViewed: boolean }> = {};
  let hasAnyProgress = false;
  let lastAccessedPageId: string | null = null;
  let firstIncompletePageId: string | null = null;

  if (clerkId && allPageIds.length > 0) {
    // Get user
    const user = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (user) {
      const progress = await database.query.userPageProgress.findMany({
        where: and(
          eq(userPageProgress.userId, user.id),
          inArray(userPageProgress.pageId, allPageIds)
        ),
      });

      for (const p of progress) {
        userProgress[p.pageId] = {
          isCompleted: p.isCompleted,
          isViewed: p.isViewed,
        };
        if (p.isCompleted || p.isViewed) {
          hasAnyProgress = true;
        }
      }

      // Find first incomplete page (for continue learning)
      for (const section of module.sections) {
        for (const page of section.pages) {
          const pageProgress = userProgress[page.id];
          if (!pageProgress?.isCompleted) {
            if (!firstIncompletePageId) {
              firstIncompletePageId = page.id;
              // Also store the section ID for the link
              lastAccessedPageId = `${section.id}/${page.id}`;
            }
            break;
          }
        }
        if (firstIncompletePageId) break;
      }
    }
  }

  // Fetch ratings for all pages in this module
  let pageRatings: Record<string, { average: number; count: number }> = {};
  if (allPageIds.length > 0) {
    const ratings = await database.query.lessonRatings.findMany({
      where: inArray(lessonRatings.pageId, allPageIds),
    });

    // Calculate averages per page
    const ratingsByPage: Record<string, number[]> = {};
    for (const rating of ratings) {
      if (!ratingsByPage[rating.pageId]) {
        ratingsByPage[rating.pageId] = [];
      }
      ratingsByPage[rating.pageId].push(rating.rating);
    }

    for (const [pageId, pageRatingsList] of Object.entries(ratingsByPage)) {
      const avg = pageRatingsList.reduce((a, b) => a + b, 0) / pageRatingsList.length;
      pageRatings[pageId] = {
        average: Math.round(avg * 10) / 10,
        count: pageRatingsList.length,
      };
    }
  }

  // Calculate overall module rating (average of all ratings across all lessons)
  const allRatingsFlat = Object.values(pageRatings).flatMap(p =>
    Array(p.count).fill(p.average)
  );
  const moduleRating = allRatingsFlat.length > 0
    ? {
        average: Math.round((allRatingsFlat.reduce((a, b) => a + b, 0) / allRatingsFlat.length) * 10) / 10,
        count: allRatingsFlat.length,
      }
    : null;

  // Calculate completion stats
  const completedCount = Object.values(userProgress).filter(p => p.isCompleted).length;
  const totalPages = allPageIds.length;
  const progressPercentage = totalPages > 0 ? Math.round((completedCount / totalPages) * 100) : 0;

  const pageTypeIcons: Record<string, typeof PlayCircle> = {
    lesson: FileText,
    quiz: HelpCircle,
    assignment: FileText,
    discussion: FileText,
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  // Determine the CTA link - continue from where left off or start from beginning
  const firstPage = module.sections[0]?.pages[0];
  const ctaLink = lastAccessedPageId
    ? `/learn/${moduleId}/${lastAccessedPageId}`
    : firstPage
    ? `/learn/${moduleId}/${module.sections[0].id}/${firstPage.id}`
    : null;

  return (
    <div className="bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/learn"
            className="inline-flex items-center text-primary-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Center
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {module.difficultyLevel && (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${difficultyColors[module.difficultyLevel]}`}>
                    {module.difficultyLevel}
                  </span>
                )}
                {module.discipline && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                    {module.discipline}
                  </span>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{module.title}</h1>
              <p className="text-lg text-primary-100 mb-4">{module.description}</p>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-primary-100">
                {moduleRating && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-white">{moduleRating.average}</span>
                    <span className="text-primary-200">({moduleRating.count} {moduleRating.count === 1 ? 'rating' : 'ratings'})</span>
                  </span>
                )}
                {module.duration && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {module.duration}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {module.sections.length} sections
                </span>
                <span className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  {totalPages} lessons
                </span>
              </div>
            </div>

            {module.thumbnailUrl && (
              <div className="lg:w-80 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={module.thumbnailUrl}
                  alt={module.title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Sections */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Course Content</h2>
              {hasAnyProgress && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-24 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-surface-600 dark:text-surface-400">
                    {completedCount}/{totalPages} completed
                  </span>
                </div>
              )}
            </div>

            {module.sections.length === 0 ? (
              <div className="bg-white dark:bg-surface-800 rounded-xl p-8 text-center border border-surface-200 dark:border-surface-700">
                <p className="text-surface-500">No sections available yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {module.sections.map((section, sectionIndex) => (
                  <div
                    key={section.id}
                    className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                  >
                    {/* Section Header */}
                    <div className="p-4 bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-surface-900 dark:text-white">
                            Section {sectionIndex + 1}: {section.title}
                          </h3>
                          {section.description && (
                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {section.estimatedDuration || `${section.pages.length} lessons`}
                        </div>
                      </div>
                    </div>

                    {/* Section Pages */}
                    <div className="divide-y divide-surface-100 dark:divide-surface-700">
                      {section.pages.map((page) => {
                        const PageIcon = pageTypeIcons[page.pageType] || FileText;
                        const pageStatus = userProgress[page.id];
                        const isCompleted = pageStatus?.isCompleted;
                        const isViewed = pageStatus?.isViewed;

                        return (
                          <Link
                            key={page.id}
                            href={`/learn/${moduleId}/${section.id}/${page.id}`}
                            className="flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCompleted
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : page.pageType === 'quiz'
                                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                                  : 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <PageIcon className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate ${
                                  isCompleted
                                    ? 'text-green-700 dark:text-green-400'
                                    : 'text-surface-900 dark:text-white'
                                }`}>
                                  {page.title}
                                </h4>
                                <p className="text-xs text-surface-500 dark:text-surface-400">
                                  {page.pageType} • {page.estimatedDuration || '10 min'}
                                  {isCompleted && ' • Completed'}
                                  {!isCompleted && isViewed && ' • In progress'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {pageRatings[page.id] && (
                                <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
                                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                  <span>{pageRatings[page.id].average}</span>
                                  <span className="text-surface-400">({pageRatings[page.id].count})</span>
                                </div>
                              )}
                              <ChevronRight className="w-5 h-5 text-surface-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Learning Objectives */}
          <div className="space-y-6">
            {/* Progress Card (if user has started) */}
            {hasAnyProgress && (
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                  Your Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-400">Completed</span>
                    <span className="font-medium text-surface-900 dark:text-white">{completedCount} of {totalPages} lessons</span>
                  </div>
                  <div className="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {progressPercentage === 100
                      ? 'Congratulations! You\'ve completed this course!'
                      : `${progressPercentage}% complete`
                    }
                  </p>
                </div>
              </div>
            )}

            {module.learningObjectives && module.learningObjectives.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                  What You&apos;ll Learn
                </h3>
                <ul className="space-y-3">
                  {module.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-surface-700 dark:text-surface-300 text-sm">
                        {objective}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Start/Continue Learning CTA */}
            {ctaLink && (
              <Link
                href={ctaLink}
                className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                {hasAnyProgress
                  ? (progressPercentage === 100 ? 'Review Course' : 'Continue Learning')
                  : 'Start Learning'
                }
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
