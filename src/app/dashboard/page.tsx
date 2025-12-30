'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types/database';

interface DashboardStats {
  completedModules: number;
  totalModules: number;
  progressPercentage: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    completedModules: 0,
    totalModules: 4,
    progressPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Load profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Load stats (simplified for now)
        const { data: modules } = await supabase
          .from('learning_modules')
          .select('id')
          .eq('status', 'published');

        const totalModules = modules?.length || 4;

        // Get completed modules for this user
        const { data: progress } = await supabase
          .from('section_progress')
          .select('module_id')
          .eq('user_id', user.id)
          .eq('completed', true);

        const uniqueCompletedModules = new Set(
          progress?.map((p) => p.module_id) || []
        );
        const completedModules = uniqueCompletedModules.size;

        setStats({
          completedModules,
          totalModules,
          progressPercentage: Math.round((completedModules / totalModules) * 100),
        });
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="space-y-4">
        <h1 className="h1">Welcome back, {profile?.first_name || 'User'}</h1>
        <p className="text-surface-600 dark:text-surface-400">
          Your learning progress: {stats.progressPercentage}%
        </p>

        {/* Progress bar */}
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${stats.progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Progress Overview */}
        <div className="card p-4">
          <h2 className="h3 mb-4">Your Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-surface-600 dark:text-surface-400">
                Completed Modules
              </span>
              <span className="text-2xl font-bold text-primary-500">
                {stats.completedModules}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-600 dark:text-surface-400">
                Total Modules
              </span>
              <span className="text-2xl font-bold">{stats.totalModules}</span>
            </div>
            <div className="border-t border-surface-200 pt-3 dark:border-surface-700">
              <div className="flex items-center justify-between">
                <span className="font-medium">Completion Rate</span>
                <span className="text-lg font-bold text-primary-500">
                  {stats.progressPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-4">
          <h2 className="h3 mb-4">Recent Activity</h2>
          <div className="space-y-3 text-sm text-surface-600 dark:text-surface-400">
            <p>No recent activity yet.</p>
            <p>Start learning to see your activity here!</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-4">
          <h2 className="h3 mb-4">Quick Actions</h2>
          <div className="grid gap-2">
            <Link
              href="/dashboard/learning/modules"
              className="btn btn-primary w-full"
            >
              Continue Learning
            </Link>
            <Link
              href="/dashboard/mentorship"
              className="btn btn-secondary w-full"
            >
              Book Mentorship Session
            </Link>
            <Link href="/profile" className="btn btn-ghost w-full">
              Update Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Learning Modules Preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="h3">Your Modules</h2>
          <Link
            href="/dashboard/learning/modules"
            className="text-primary-500 hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            'Introduction to Petroleum Geology',
            'Structural Geology',
            'Seismic Interpretation',
            'Petroleum Systems',
          ].map((module, index) => (
            <div key={module} className="card p-4">
              <div className="mb-2 text-3xl">📖</div>
              <h3 className="font-medium">{module}</h3>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${index === 0 ? 25 : 0}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-surface-500">
                {index === 0 ? '25% complete' : 'Not started'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
