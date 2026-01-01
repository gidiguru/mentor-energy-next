'use client';

import { SignUp } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SignUpPage() {
  const [showVerificationNote, setShowVerificationNote] = useState(false);

  useEffect(() => {
    // Listen for clicks on Clerk buttons
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if clicked element is a Clerk button (social or submit)
      const isClerkButton =
        target.closest('.cl-socialButtonsBlockButton') ||
        target.closest('.cl-formButtonPrimary') ||
        target.closest('button[data-localization-key]') ||
        target.closest('.cl-socialButtonsIconButton');

      if (isClerkButton) {
        setShowVerificationNote(true);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Helper text for Cloudflare verification - shows after button click */}
        {showVerificationNote && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in">
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
        )}

        <SignUp
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
          path="/signup"
          signInUrl="/auth"
          fallbackRedirectUrl="/auth/complete-signup"
        />
      </div>
    </div>
  );
}
