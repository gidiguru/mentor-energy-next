'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/theme';
import { useDrawerStore } from '@/lib/stores/drawer';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
  SignInButton,
  SignOutButton,
  UserButton,
  SignedIn,
  SignedOut,
  useUser,
} from '@clerk/nextjs';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/mentors', label: 'Find Mentors' },
  { href: '/resources', label: 'Resources' },
];

export function Header() {
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { open: openDrawer } = useDrawerStore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = isDarkMode
    ? '/logos/mentorenergy_Main_Logo2.svg'
    : '/logos/mentorenergy_Black_Logo2.svg';

  const logoSymbolSrc = isDarkMode
    ? '/logos/mentorenergy_Logo_Symbol2_dark.svg'
    : '/logos/mentorenergy_Logo_Symbol2.svg';

  return (
    <header className="preset-filled-surface-100-900 sticky top-0 z-50 w-full border-b border-surface-200-800 backdrop-blur-lg">
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
                'text-lg font-medium transition-colors hover:text-brand-600',
                pathname === item.href && 'text-brand-600'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Profile link when logged in */}
          <SignedIn>
            <Link
              href="/profile"
              className="hidden items-center gap-2 transition-colors hover:text-primary-500 md:flex"
            >
              <UserButton afterSignOutUrl="/" />
              <span className="hidden md:inline">
                {user?.firstName || 'Profile'}
              </span>
            </Link>
          </SignedIn>

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
          <SignedIn>
            <SignOutButton>
              <button className="btn btn-error hidden md:inline-flex">
                Sign Out
              </button>
            </SignOutButton>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-primary hidden md:inline-flex">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
