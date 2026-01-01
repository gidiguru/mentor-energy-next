'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

function TimeoutBanner() {
  const searchParams = useSearchParams();
  const isTimeout = searchParams.get('timeout') === 'true';

  if (!isTimeout) return null;

  return (
    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        <div>
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            Session Expired
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            You were logged out due to inactivity. Please sign in again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <TimeoutBanner />
        </Suspense>

        {/* Helper text for Cloudflare verification */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Verification Required
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Please complete the "Verify you are human" checkbox at the bottom of the form before clicking Continue.
              </p>
            </div>
          </div>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full',
              card: 'bg-white dark:bg-surface-800 shadow-lg',
              headerTitle: 'text-surface-900 dark:text-white',
              headerSubtitle: 'text-surface-600 dark:text-surface-400',
              socialButtonsBlockButton:
                'bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 border-surface-300 dark:border-surface-600',
              socialButtonsBlockButtonText: 'text-surface-900 dark:text-white',
              formFieldLabel: 'text-surface-700 dark:text-surface-300',
              formFieldInput:
                'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white',
              footerActionLink: 'text-primary-500 hover:text-primary-600',
              formButtonPrimary:
                'bg-primary-500 hover:bg-primary-600 text-white',
            },
          }}
          routing="path"
          path="/auth"
          signUpUrl="/signup"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
