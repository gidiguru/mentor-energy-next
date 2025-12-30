'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Moon, Sun, User } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/theme';
import { useDrawerStore } from '@/lib/stores/drawer';
import { useAuthStore } from '@/lib/stores/auth';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/mentors', label: 'Find Mentors' },
  { href: '/resources', label: 'Resources' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { open: openDrawer } = useDrawerStore();
  const { session, profile, setSession, setProfile, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession, setProfile]);

  async function fetchProfile(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth();
    router.push('/');
  }

  const logoSrc = isDarkMode
    ? '/logos/mentorenergy_Main_Logo2.svg'
    : '/logos/mentorenergy_Black_Logo2.svg';

  const logoSymbolSrc = isDarkMode
    ? '/logos/mentorenergy_Logo_Symbol2_dark.svg'
    : '/logos/mentorenergy_Logo_Symbol2.svg';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-200 bg-white/80 backdrop-blur-lg dark:border-surface-700 dark:bg-surface-900/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <img
            src={logoSrc}
            alt="mentor.energy logo"
            className="hidden h-10 w-auto md:block md:h-12"
          />
          <img
            src={logoSymbolSrc}
            alt="mentor.energy logo"
            className="block h-10 w-auto md:hidden"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-lg font-medium transition-colors hover:text-primary-500',
                pathname === item.href && 'text-primary-500'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Profile link when logged in */}
          {session && profile && (
            <Link
              href="/profile"
              className="hidden items-center gap-2 transition-colors hover:text-primary-500 md:flex"
            >
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border-2 border-surface-500 object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-500 bg-surface-200 dark:bg-surface-700">
                  <User className="h-5 w-5" />
                </div>
              )}
              <span className="hidden md:inline">
                {profile.first_name || 'Profile'}
              </span>
            </Link>
          )}

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={openDrawer}
            className="rounded-lg p-2 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Auth buttons */}
          {session ? (
            <button
              onClick={handleSignOut}
              className="btn btn-error hidden md:inline-flex"
            >
              Sign Out
            </button>
          ) : (
            <Link href="/auth" className="btn btn-primary hidden md:inline-flex">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
