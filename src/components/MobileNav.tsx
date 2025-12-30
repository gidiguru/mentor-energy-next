'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDrawerStore } from '@/lib/stores/drawer';
import { cn } from '@/lib/utils';
import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/mentors', label: 'Find Mentors' },
  { href: '/resources', label: 'Resources' },
  { href: '/profile', label: 'Profile' },
  { href: '/admin', label: 'Admin' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { close } = useDrawerStore();

  return (
    <div className="p-4">
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={close}
                className={cn(
                  'block w-full rounded-lg px-4 py-3 text-lg font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 text-surface-900 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700'
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Auth buttons for mobile */}
      <div className="mt-6 space-y-2">
        <SignedIn>
          <SignOutButton>
            <button
              onClick={close}
              className="btn btn-error w-full"
            >
              Sign Out
            </button>
          </SignOutButton>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              onClick={close}
              className="btn btn-primary w-full"
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
