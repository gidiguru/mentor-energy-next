'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  discipline: string | null;
  qualification: string | null;
  university: string | null;
  role: string;
}

interface DashboardStats {
  completedModules: number;
  totalModules: number;
  progressPercentage: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    completedModules: 0,
    totalModules: 4,
    progressPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile from Neon database
        const response = await fetch(`/api/user/profile`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }

        // For now, use default stats since we don't have modules yet
        setStats({
          completedModules: 0,
          totalModules: 4,
          progressPercentage: 0,
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [user, isLoaded]);

  if (loading || !isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const displayName = profile?.first_name || user?.firstName || 'User';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="space-y-4">
        <h1 className="h1">Welcome back, {displayName}</h1>
        <p className="text-surface-500 dark:text-surface-300">
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
        <div className="card preset-filled-surface-100-900 p-4">
          <h2 className="h3 mb-4">Your Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-surface-500 dark:text-surface-300">
                Completed Modules
              </span>
              <span className="text-2xl font-bold text-primary-500">
                {stats.completedModules}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500 dark:text-surface-300">
                Total Modules
              </span>
              <span className="text-2xl font-bold">{stats.totalModules}</span>
            </div>
            <div className="border-t border-surface-200-800 pt-3">
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
        <div className="card preset-filled-surface-100-900 p-4">
          <h2 className="h3 mb-4">Recent Activity</h2>
          <div className="space-y-3 text-sm text-surface-500 dark:text-surface-300">
            <p>No recent activity yet.</p>
            <p>Start learning to see your activity here!</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card preset-filled-surface-100-900 p-4">
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
            <div key={module} className="card preset-filled-surface-100-900 p-4">
              <div className="mb-2 text-3xl">📖</div>
              <h3 className="font-medium">{module}</h3>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${index === 0 ? 25 : 0}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-300">
                {index === 0 ? '25% complete' : 'Not started'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
