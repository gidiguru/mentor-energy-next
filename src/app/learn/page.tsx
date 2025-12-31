'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { BookOpen, Clock, BarChart3, ChevronRight, Check, Loader2 } from 'lucide-react';

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

interface Enrollment {
  moduleId: string;
  moduleSlug: string;
}

export default function LearnPage() {
  const { user, isLoaded } = useUser();
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch modules
        const modulesRes = await fetch('/api/modules');
        if (modulesRes.ok) {
          const data = await modulesRes.json();
          setModules(data.modules || []);
        }

        // Fetch user's enrollments if logged in
        if (user) {
          const enrollRes = await fetch('/api/enrollments');
          if (enrollRes.ok) {
            const data = await enrollRes.json();
            const enrolledIds = new Set<string>(
              (data.enrollments || []).map((e: Enrollment) => e.moduleId)
            );
            setEnrollments(enrolledIds);
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

  const handleEnroll = async (moduleId: string, e: React.MouseEvent) => {
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
        setEnrollments(prev => new Set([...prev, moduleId]));
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

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Learning Center</h1>
          <p className="text-xl text-primary-100 max-w-2xl">
            Master petroleum engineering with our comprehensive curriculum designed by industry experts.
          </p>
          {user && enrollments.size > 0 && (
            <p className="mt-4 text-primary-200">
              You are enrolled in {enrollments.size} course{enrollments.size !== 1 ? 's' : ''}
            </p>
          )}
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
            {modules.map((module) => {
              const isEnrolled = enrollments.has(module.id);
              const isEnrolling = enrollingId === module.id;

              return (
                <div
                  key={module.id}
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
                      {isEnrolled && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Enrolled
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
                        href={`/learn/${module.moduleId}`}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                      >
                        Continue Learning
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => handleEnroll(module.id, e)}
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
