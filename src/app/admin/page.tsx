import { db, learningModules, resources, users, mentorApplications, eq } from '@/lib/db';
import Link from 'next/link';
import { BookOpen, FileText, Users, TrendingUp, Image, UserCheck, UserCog } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const database = db();

  // Get counts
  const [modulesResult, resourcesResult, usersResult, pendingApplicationsResult] = await Promise.all([
    database.select().from(learningModules),
    database.select().from(resources),
    database.select().from(users),
    database.select().from(mentorApplications).where(eq(mentorApplications.status, 'pending')),
  ]);

  const stats = [
    {
      label: 'Total Modules',
      value: modulesResult.length,
      icon: BookOpen,
      href: '/admin/modules',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    },
    {
      label: 'Total Resources',
      value: resourcesResult.length,
      icon: FileText,
      href: '/admin/resources',
      color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    },
    {
      label: 'Registered Users',
      value: usersResult.length,
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    },
    {
      label: 'Pending Mentor Applications',
      value: pendingApplicationsResult.length,
      icon: UserCheck,
      href: '/admin/mentor-applications',
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
    },
  ];

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-sm md:text-base text-surface-600 dark:text-surface-400">
          Manage your learning content and resources.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-1">
              {stat.value}
            </p>
            <p className="text-sm md:text-base text-surface-500 dark:text-surface-400">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700">
        <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/modules"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">Add Module</span>
          </Link>
          <Link
            href="/admin/resources"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <FileText className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">Add Resource</span>
          </Link>
          <Link
            href="/admin/media"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <Image className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">Media Library</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <Users className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">Manage Users</span>
          </Link>
          <Link
            href="/admin/mentor-applications"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <UserCheck className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">Mentor Applications</span>
          </Link>
          <Link
            href="/admin/mentors"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <UserCog className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">Manage Mentors</span>
          </Link>
          <Link
            href="/admin/seed"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">Seed Sample Data</span>
          </Link>
          <Link
            href="/learn"
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-surface-900 dark:text-white">View Learning Center</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
