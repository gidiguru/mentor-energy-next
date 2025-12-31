'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock, CheckCircle, ArrowRight } from 'lucide-react';

interface PrerequisiteStatus {
  moduleId: string;
  moduleTitle: string;
  isCompleted: boolean;
}

interface PrerequisitesData {
  canAccess: boolean;
  prerequisites: PrerequisiteStatus[];
  incompletePrerequisites: PrerequisiteStatus[];
  message?: string;
}

interface PrerequisitesBannerProps {
  moduleId: string;
  onAccessDetermined?: (canAccess: boolean) => void;
}

export default function PrerequisitesBanner({ moduleId, onAccessDetermined }: PrerequisitesBannerProps) {
  const [data, setData] = useState<PrerequisitesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPrerequisites() {
      try {
        const response = await fetch(`/api/modules/${moduleId}/prerequisites`);
        if (response.ok) {
          const prereqData = await response.json();
          setData(prereqData);
          onAccessDetermined?.(prereqData.canAccess);
        }
      } catch (error) {
        console.error('Error checking prerequisites:', error);
        // On error, allow access (fail open)
        onAccessDetermined?.(true);
      } finally {
        setLoading(false);
      }
    }

    checkPrerequisites();
  }, [moduleId, onAccessDetermined]);

  if (loading || !data || data.canAccess) {
    return null;
  }

  const { prerequisites, incompletePrerequisites, message } = data;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">
            Prerequisites Required
          </h3>
          <p className="text-amber-700 dark:text-amber-400 mb-4">
            {message || 'Please complete the following courses before accessing this module:'}
          </p>

          <div className="space-y-3">
            {prerequisites.map((prereq) => (
              <div
                key={prereq.moduleId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  prereq.isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-surface-800 border border-amber-200 dark:border-amber-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {prereq.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className={prereq.isCompleted
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-surface-900 dark:text-white'
                  }>
                    {prereq.moduleTitle}
                  </span>
                </div>
                {!prereq.isCompleted && (
                  <Link
                    href={`/learn/${prereq.moduleId}`}
                    className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Start Course
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {incompletePrerequisites.length > 0 && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
              Complete {incompletePrerequisites.length === 1 ? 'this course' : 'these courses'} to unlock this module
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
