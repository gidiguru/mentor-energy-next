'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { BookOpen, Clock, BarChart3, ChevronRight, Check, Loader2, PlayCircle, Search, X } from 'lucide-react';

interface Module {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  difficultyLevel: string | null;
  discipline: string | null;
  learningObjectives: string[] | null;
}

interface EnrollmentData {
  moduleId: string;
  moduleSlug: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  nextLessonLink: string | null;
}

export default function LearnPage() {
  const { user, isLoaded } = useUser();
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollmentMap, setEnrollmentMap] = useState<Map<string, EnrollmentData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch modules
        const modulesRes = await fetch('/api/modules');
        if (modulesRes.ok) {
          const data = await modulesRes.json();
          setModules(data.modules || []);
        }

        // Fetch user's enrollments with progress if logged in
        if (user) {
          const enrollRes = await fetch('/api/enrollments');
          if (enrollRes.ok) {
            const data = await enrollRes.json();
            const map = new Map<string, EnrollmentData>();
            for (const e of data.enrollments || []) {
              map.set(e.moduleId, {
                moduleId: e.moduleId,
                moduleSlug: e.moduleSlug,
                progress: e.progress || 0,
                totalLessons: e.totalLessons || 0,
                completedLessons: e.completedLessons || 0,
                nextLessonLink: e.nextLessonLink,
              });
            }
            setEnrollmentMap(map);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      loadData();
    }
  }, [user, isLoaded]);

  const handleEnroll = async (moduleId: string, moduleSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to sign in
      window.location.href = '/sign-in?redirect_url=/learn';
      return;
    }

    setEnrollingId(moduleId);

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add to enrollment map with initial progress
        const enrolledModuleId = data.enrollment?.moduleId || moduleId;
        setEnrollmentMap(prev => {
          const newMap = new Map(prev);
          newMap.set(enrolledModuleId, {
            moduleId: enrolledModuleId,
            moduleSlug: data.enrollment?.moduleSlug || moduleSlug,
            progress: 0,
            totalLessons: 0,
            completedLessons: 0,
            nextLessonLink: null,
          });
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setEnrollingId(null);
    }
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const enrolledCount = enrollmentMap.size;

  // Filter modules based on search query
  const filteredModules = modules.filter((module) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.title.toLowerCase().includes(query) ||
      module.description?.toLowerCase().includes(query) ||
      module.discipline?.toLowerCase().includes(query) ||
      module.difficultyLevel?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Learning Center</h1>
          <p className="text-xl text-primary-100 max-w-2xl">
            Master the energy industry with our comprehensive curriculum designed by industry experts.
          </p>
          {user && enrolledCount > 0 && (
            <p className="mt-4 text-primary-200">
              You are enrolled in {enrolledCount} course{enrolledCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search courses by title, topic, or difficulty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-surface-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Search results info */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-surface-600 dark:text-surface-400">
              {filteredModules.length === 0
                ? 'No courses found'
                : `Found ${filteredModules.length} course${filteredModules.length !== 1 ? 's' : ''}`}
              {' '}for &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        )}

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
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto text-surface-400 mb-4" />
            <h2 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
              No courses match your search
            </h2>
            <p className="text-surface-500 mb-4">
              Try adjusting your search terms or browse all courses
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              View all courses
            </button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((module) => {
              const enrollment = enrollmentMap.get(module.id);
              const isEnrolled = !!enrollment;
              const isEnrolling = enrollingId === module.id;
              const progress = enrollment?.progress || 0;
              const isCompleted = progress === 100;
              const hasStarted = progress > 0;

              // Determine button text and link
              let buttonText = 'Start Learning';
              let buttonLink = `/learn/${module.moduleId}`;

              if (isCompleted) {
                buttonText = 'Review Course';
              } else if (hasStarted) {
                buttonText = 'Continue Learning';
                if (enrollment?.nextLessonLink) {
                  buttonLink = enrollment.nextLessonLink;
                }
              }

              return (
                <div
                  key={module.id}
                  className="group bg-white dark:bg-surface-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-surface-200 dark:border-surface-700"
                >
                  {/* Thumbnail */}
                  {module.thumbnailUrl && (
                    <div className="aspect-video bg-surface-200 dark:bg-surface-700 overflow-hidden relative">
                      <img
                        src={module.thumbnailUrl}
                        alt={module.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Progress overlay for enrolled courses */}
                      {isEnrolled && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <div className="flex items-center justify-between text-white text-sm mb-1">
                            <span>{enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-primary-400'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
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
                      {isEnrolled && (
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : hasStarted
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-300'
                        }`}>
                          {isCompleted ? (
                            <>
                              <Check className="w-3 h-3" />
                              Completed
                            </>
                          ) : hasStarted ? (
                            <>
                              <PlayCircle className="w-3 h-3" />
                              In Progress
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              Enrolled
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                      {module.title}
                    </h2>
                    <p className="text-surface-600 dark:text-surface-400 text-sm mb-4 line-clamp-2">
                      {module.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400 mb-4">
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

                    {/* Action Button */}
                    {isEnrolled ? (
                      <Link
                        href={buttonLink}
                        className={`w-full flex items-center justify-center gap-2 font-medium py-2.5 px-4 rounded-lg transition-colors ${
                          isCompleted
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {buttonText}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => handleEnroll(module.id, module.moduleId, e)}
                        disabled={isEnrolling}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                      >
                        {isEnrolling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4" />
                            Enroll Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
