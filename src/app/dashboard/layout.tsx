'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Menu, LogOut } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  hasSubItems?: boolean;
  subItems?: { path: string; label: string; icon: string }[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Overview', icon: '🏠' },
  {
    path: '/dashboard/learning',
    label: 'Learning',
    icon: '📚',
    hasSubItems: true,
    subItems: [
      { path: '/dashboard/learning/modules', label: 'Modules', icon: '📖' },
      { path: '/dashboard/learning/virtual-labs', label: 'Virtual Labs', icon: '🔬' },
      { path: '/dashboard/learning/field-trips', label: 'Field Trips', icon: '🌍' },
    ],
  },
  { path: '/dashboard/mentorship', label: 'Mentorship', icon: '👥' },
  {
    path: '/dashboard/community',
    label: 'Community',
    icon: '💬',
    hasSubItems: true,
    subItems: [
      { path: '/dashboard/community/chat', label: 'Chat Room', icon: '💭' },
      { path: '/dashboard/community/challenges', label: 'Challenges', icon: '🎮' },
    ],
  },
  { path: '/dashboard/projects', label: 'Projects', icon: '📋' },
  { path: '/dashboard/certifications', label: 'Certificates', icon: '🏆' },
  { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsNavOpen(false);
      }
    }

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  function toggleSubMenu(path: string) {
    setExpandedItem(expandedItem === path ? null : path);
  }

  function handleNavClick() {
    setIsNavOpen(false);
  }

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.path;
    const isExpanded = expandedItem === item.path;

    if (item.hasSubItems) {
      return (
        <div key={item.path} className="w-full">
          <button
            onClick={() => toggleSubMenu(item.path)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left',
              isActive ? 'nav-item-active' : 'nav-item'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isExpanded && item.subItems && (
            <div className="mt-1 space-y-1 rounded-lg bg-gray-200 p-2">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.path}
                  href={subItem.path}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 pl-8',
                    pathname === subItem.path ? 'nav-item-active' : 'nav-item'
                  )}
                >
                  <span className="text-lg">{subItem.icon}</span>
                  <span>{subItem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        href={item.path}
        onClick={handleNavClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-3',
          isActive ? 'nav-item-active' : 'nav-item'
        )}
      >
        <span className="text-xl">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="sidebar-bg h-full w-64 overflow-y-auto border-r border-gray-300 p-4">
          <div className="flex h-full flex-col gap-2">
            {navItems.map(renderNavItem)}

            <button
              onClick={handleSignOut}
              className="mt-auto flex items-center gap-3 rounded-lg px-3 py-3 text-red-500 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="sticky top-0 z-40 border-b border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="btn btn-primary flex w-full items-center justify-center gap-2"
            >
              <Menu className="h-5 w-5" />
              <span>Menu</span>
              {isNavOpen ? (
                <ChevronDown className="ml-auto h-5 w-5" />
              ) : (
                <ChevronRight className="ml-auto h-5 w-5" />
              )}
            </button>

            {isNavOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40 bg-black/50"
                  onClick={() => setIsNavOpen(false)}
                />

                {/* Mobile Nav */}
                <nav className="fixed inset-x-4 top-20 z-50 max-h-[80vh] overflow-y-auto rounded-xl border-2 border-primary-500 bg-white shadow-2xl dark:bg-surface-900">
                  <div className="flex flex-col p-2">
                    {navItems.map(renderNavItem)}

                    <button
                      onClick={handleSignOut}
                      className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 text-red-500 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </nav>
              </>
            )}
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
