'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Trophy,
  Flame,
  Award,
  TrendingUp,
  Clock,
  Target,
  ChevronRight,
  Loader2,
  BarChart3,
} from 'lucide-react';

interface WeeklyActivity {
  date: string;
  lessonsCompleted: number;
}

interface CourseProgress {
  moduleId: string;
  moduleSlug: string;
  title: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt: string | null;
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

interface AnalyticsData {
  lessonsCompleted: number;
  totalLessonsViewed: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  achievementsUnlocked: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: WeeklyActivity[];
  courseProgress: CourseProgress[];
  recentActivity: RecentActivity[];
  leaderboardRank: number | null;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load analytics');
        }
      } catch (err) {
        setError('Failed to load analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-surface-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-surface-400 mx-auto mb-4" />
          <p className="text-surface-500">{error || 'No analytics data available'}</p>
        </div>
      </div>
    );
  }

  // Get day labels for the weekly chart
  const dayLabels = data.weeklyActivity.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  });

  // Find max for scaling
  const maxLessons = Math.max(...data.weeklyActivity.map(d => d.lessonsCompleted), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
          Learning Analytics
        </h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          Track your learning progress and achievements
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          label="Lessons Completed"
          value={data.lessonsCompleted}
          color="blue"
        />
        <StatCard
          icon={<Flame className="w-6 h-6" />}
          label="Current Streak"
          value={`${data.currentStreak} days`}
          subValue={`Best: ${data.longestStreak} days`}
          color="orange"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Certificates"
          value={data.certificatesEarned}
          color="green"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Achievements"
          value={data.achievementsUnlocked}
          subValue={`${data.totalPoints} points`}
          color="purple"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Courses Enrolled"
          value={data.coursesEnrolled}
          color="primary"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Courses Completed"
          value={data.coursesCompleted}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Lessons Viewed"
          value={data.totalLessonsViewed}
          color="blue"
        />
        {data.leaderboardRank && (
          <StatCard
            icon={<Trophy className="w-6 h-6" />}
            label="Leaderboard Rank"
            value={`#${data.leaderboardRank}`}
            color="yellow"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity Chart */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
            Weekly Activity
          </h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {data.weeklyActivity.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-28">
                  <span className="text-xs text-surface-500 mb-1">
                    {day.lessonsCompleted > 0 ? day.lessonsCompleted : ''}
                  </span>
                  <div
                    className="w-full max-w-8 bg-primary-500 rounded-t transition-all duration-300"
                    style={{
                      height: `${(day.lessonsCompleted / maxLessons) * 100}%`,
                      minHeight: day.lessonsCompleted > 0 ? '8px' : '2px',
                      backgroundColor: day.lessonsCompleted > 0 ? undefined : '#e5e7eb',
                    }}
                  />
                </div>
                <span className="text-xs text-surface-500">{dayLabels[index]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <p className="text-sm text-surface-500 text-center">
              {data.weeklyActivity.reduce((sum, d) => sum + d.lessonsCompleted, 0)} lessons completed this week
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-surface-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                >
                  <span className="text-xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 dark:text-white text-sm">
                      {activity.title}
                    </p>
                    <p className="text-sm text-surface-600 dark:text-surface-400 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-surface-400 mt-1">
                      {formatRelativeDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Progress */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
            Course Progress
          </h2>
          <Link
            href="/learn"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Browse Courses
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {data.courseProgress.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-surface-400 mx-auto mb-3" />
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              You haven't enrolled in any courses yet
            </p>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.courseProgress.map((course) => (
              <Link
                key={course.moduleId}
                href={`/learn/${course.moduleSlug}`}
                className="block p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-surface-900 dark:text-white truncate pr-4">
                    {course.title}
                  </h3>
                  <span className="text-sm font-semibold text-primary-600">
                    {course.progress}%
                  </span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      course.progress === 100 ? 'bg-green-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-surface-500">
                  <span>
                    {course.completedLessons} of {course.totalLessons} lessons
                  </span>
                  {course.lastAccessedAt && (
                    <span>Last accessed: {formatRelativeDate(course.lastAccessedAt)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'primary' | 'yellow';
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
      {subValue && (
        <p className="text-xs text-surface-400 mt-1">{subValue}</p>
      )}
    </div>
  );
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
