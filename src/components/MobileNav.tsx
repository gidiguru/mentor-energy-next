'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDrawerStore } from '@/lib/stores/drawer';
import { cn } from '@/lib/utils';
import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  useUser,
} from '@clerk/nextjs';

const baseNavItems = [
  { href: '/', label: 'Home' },
  { href: '/learn', label: 'Learning Center' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/mentors', label: 'Find Mentors' },
  { href: '/resources', label: 'Resources' },
  { href: '/profile', label: 'Profile' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { close } = useDrawerStore();
  const { isSignedIn } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin))
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [isSignedIn]);

  const navItems = isAdmin
    ? [...baseNavItems, { href: '/admin', label: 'Admin' }]
    : baseNavItems;

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
