'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  GraduationCap,
  Trophy,
  Award,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Star,
  Loader2,
  BarChart3,
  Calendar,
  ChevronRight,
  UserPlus,
  Activity,
} from 'lucide-react';

interface DailyStats {
  date: string;
  newUsers: number;
  lessonsCompleted: number;
  enrollments: number;
}

interface PopularCourse {
  moduleId: string;
  moduleSlug: string;
  title: string;
  enrollmentCount: number;
  completionRate: number;
  averageProgress: number;
}

interface UserGrowth {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
}

interface EngagementStats {
  totalComments: number;
  totalRatings: number;
  averageRating: number;
  totalBookmarks: number;
  totalNotes: number;
}

interface TopLearner {
  id: string;
  name: string;
  lessonsCompleted: number;
  certificatesEarned: number;
}

interface RecentActivity {
  userName: string;
  courseName: string;
  date: string;
}

interface AdminAnalyticsData {
  totalUsers: number;
  totalModules: number;
  totalLessons: number;
  totalEnrollments: number;
  totalCertificates: number;
  totalAchievementsEarned: number;
  userGrowth: UserGrowth;
  popularCourses: PopularCourse[];
  overallCompletionRate: number;
  engagement: EngagementStats;
  dailyStats: DailyStats[];
  topLearners: TopLearner[];
  recentEnrollments: RecentActivity[];
  recentCertificates: RecentActivity[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'users' | 'lessons' | 'enrollments'>('lessons');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/admin/analytics');
        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load analytics');
        }
      } catch (err) {
        setError('Failed to load analytics');
        console.error('Error fetching admin analytics:', err);
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

  // Get chart data based on selected type
  const getChartData = () => {
    switch (chartType) {
      case 'users':
        return data.dailyStats.map(d => d.newUsers);
      case 'enrollments':
        return data.dailyStats.map(d => d.enrollments);
      default:
        return data.dailyStats.map(d => d.lessonsCompleted);
    }
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData, 1);

  // Calculate totals for the chart period
  const totals = {
    users: data.dailyStats.reduce((sum, d) => sum + d.newUsers, 0),
    lessons: data.dailyStats.reduce((sum, d) => sum + d.lessonsCompleted, 0),
    enrollments: data.dailyStats.reduce((sum, d) => sum + d.enrollments, 0),
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
          Platform Analytics
        </h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          Monitor platform performance and user engagement
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Users"
          value={data.totalUsers}
          color="blue"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Courses"
          value={data.totalModules}
          color="purple"
        />
        <StatCard
          icon={<GraduationCap className="w-5 h-5" />}
          label="Enrollments"
          value={data.totalEnrollments}
          color="green"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Certificates"
          value={data.totalCertificates}
          color="yellow"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Achievements"
          value={data.totalAchievementsEarned}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Completion Rate"
          value={`${data.overallCompletionRate}%`}
          color="primary"
        />
      </div>

      {/* User Growth & Engagement Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            User Growth
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.userGrowth.newUsersThisWeek}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">New this week</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.userGrowth.newUsersThisMonth}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">New this month</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.userGrowth.activeUsersToday}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">Active today</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {data.userGrowth.activeUsersThisWeek}
              </p>
              <p className="text-sm text-surface-600 dark:text-surface-400">Active this week</p>
            </div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Engagement
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-surface-500" />
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {data.engagement.totalComments}
                </p>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400">Total Comments</p>
            </div>
            <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {data.engagement.totalRatings}
                </p>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400">Total Ratings</p>
            </div>
            <div className="col-span-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-400">Average Rating</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {data.engagement.averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(data.engagement.averageRating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-surface-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Activity Chart */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              30-Day Activity
            </h2>
            <p className="text-sm text-surface-500">Daily platform activity over the last 30 days</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('lessons')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                chartType === 'lessons'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              Lessons ({totals.lessons})
            </button>
            <button
              onClick={() => setChartType('users')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                chartType === 'users'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              New Users ({totals.users})
            </button>
            <button
              onClick={() => setChartType('enrollments')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                chartType === 'enrollments'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              Enrollments ({totals.enrollments})
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 flex items-end gap-1">
          {chartData.map((value, index) => {
            const date = new Date(data.dailyStats[index].date);
            const isWeekStart = date.getDay() === 0;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group"
              >
                <div className="relative w-full flex justify-center">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-surface-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {value}
                    </div>
                  </div>
                  <div
                    className={`w-full max-w-3 rounded-t transition-all duration-200 ${
                      chartType === 'lessons'
                        ? 'bg-primary-500 hover:bg-primary-600'
                        : chartType === 'users'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    style={{
                      height: `${Math.max((value / maxValue) * 100, value > 0 ? 4 : 1)}%`,
                      minHeight: value > 0 ? '4px' : '1px',
                    }}
                  />
                </div>
                {isWeekStart && (
                  <span className="text-[10px] text-surface-400 mt-1">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Courses & Top Learners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Courses */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              Popular Courses
            </h2>
            <Link
              href="/admin/modules"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Manage
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {data.popularCourses.length === 0 ? (
            <p className="text-surface-500 text-center py-8">No courses yet</p>
          ) : (
            <div className="space-y-3">
              {data.popularCourses.slice(0, 5).map((course, index) => (
                <div
                  key={course.moduleId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                >
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 dark:text-white truncate">
                      {course.title}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-surface-500">
                      <span>{course.enrollmentCount} enrolled</span>
                      <span>{course.completionRate}% completion</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                      {course.averageProgress}%
                    </p>
                    <p className="text-xs text-surface-500">avg progress</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Learners */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              Top Learners
            </h2>
            <Link
              href="/admin/users"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {data.topLearners.length === 0 ? (
            <p className="text-surface-500 text-center py-8">No learners yet</p>
          ) : (
            <div className="space-y-3">
              {data.topLearners.slice(0, 5).map((learner, index) => (
                <div
                  key={learner.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === 0
                      ? 'bg-yellow-100 text-yellow-600'
                      : index === 1
                      ? 'bg-surface-200 text-surface-600'
                      : index === 2
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-surface-100 text-surface-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 dark:text-white truncate">
                      {learner.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      {learner.certificatesEarned} certificate{learner.certificatesEarned !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                      {learner.lessonsCompleted}
                    </p>
                    <p className="text-xs text-surface-500">lessons</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-500" />
            Recent Enrollments
          </h2>
          {data.recentEnrollments.length === 0 ? (
            <p className="text-surface-500 text-center py-8">No enrollments yet</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.recentEnrollments.map((enrollment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                >
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                      {enrollment.userName}
                    </p>
                    <p className="text-xs text-surface-500 truncate">
                      enrolled in {enrollment.courseName}
                    </p>
                  </div>
                  <span className="text-xs text-surface-400">
                    {formatRelativeDate(enrollment.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Certificates */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Recent Certificates
          </h2>
          {data.recentCertificates.length === 0 ? (
            <p className="text-surface-500 text-center py-8">No certificates yet</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.recentCertificates.map((cert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                >
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                      {cert.userName}
                    </p>
                    <p className="text-xs text-surface-500 truncate">
                      completed {cert.courseName}
                    </p>
                  </div>
                  <span className="text-xs text-surface-400">
                    {formatRelativeDate(cert.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'primary' | 'yellow';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
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
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
      <p className="text-xs text-surface-500">{label}</p>
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
