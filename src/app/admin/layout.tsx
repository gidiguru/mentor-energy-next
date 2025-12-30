import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, FileText, Settings, Database, ArrowLeft } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth');
  }

  // TODO: Add admin role check when user roles are implemented
  // For now, allow any authenticated user to access admin

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/modules', icon: BookOpen, label: 'Modules' },
    { href: '/admin/resources', icon: FileText, label: 'Resources' },
    { href: '/admin/seed', icon: Database, label: 'Seed Data' },
  ];

  return (
    <div className="min-h-screen bg-surface-100 dark:bg-surface-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-surface-500">Content Management</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
