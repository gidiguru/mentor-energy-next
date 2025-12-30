import { db, learningModules, resources, users } from '@/lib/db';
import Link from 'next/link';
import { BookOpen, FileText, Users, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const database = db();

  // Get counts
  const [modulesResult, resourcesResult, usersResult] = await Promise.all([
    database.select().from(learningModules),
    database.select().from(resources),
    database.select().from(users),
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
      href: '#',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Manage your learning content and resources.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-surface-900 dark:text-white mb-1">
              {stat.value}
            </p>
            <p className="text-surface-500 dark:text-surface-400">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
