'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Clock, BookOpen, Target } from 'lucide-react';

interface Module {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  duration: string | null;
  difficulty_level: string | null;
}

const defaultModules = [
  {
    id: '1',
    module_id: 'intro-petroleum',
    title: 'Introduction to Petroleum Geology',
    description: 'Learn the fundamentals of petroleum geology, including the origin, migration, and accumulation of hydrocarbons.',
    duration: '4 hours',
    difficulty_level: 'Beginner',
  },
  {
    id: '2',
    module_id: 'structural-geology',
    title: 'Structural Geology',
    description: 'Understand geological structures, faults, folds, and their role in petroleum traps.',
    duration: '6 hours',
    difficulty_level: 'Intermediate',
  },
  {
    id: '3',
    module_id: 'seismic-interpretation',
    title: 'Seismic Interpretation',
    description: 'Learn to interpret seismic data for subsurface mapping and reservoir characterization.',
    duration: '8 hours',
    difficulty_level: 'Intermediate',
  },
  {
    id: '4',
    module_id: 'petroleum-systems',
    title: 'Petroleum Systems',
    description: 'Explore the components and processes that create and preserve petroleum accumulations.',
    duration: '5 hours',
    difficulty_level: 'Advanced',
  },
];

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>(defaultModules);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModules() {
      const supabase = createClient();
      const { data } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setModules(data);
      }
      setLoading(false);
    }

    loadModules();
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h2 mb-2">Learning Modules</h1>
        <p className="text-surface-600 dark:text-surface-400">
          Start your learning journey with our comprehensive modules
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="text-lg">Loading modules...</div>
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
                    module.difficulty_level
                  )}`}
                >
                  {module.difficulty_level || 'All Levels'}
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
                  <span>4 sections</span>
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
                href={`/dashboard/learning/modules/${module.module_id}`}
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
