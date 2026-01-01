'use client';

import { SignUp, useSignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { Mail, Users } from 'lucide-react';

type AuthMethod = 'choice' | 'social' | 'email';

export default function SignUpPage() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('choice');

  // Choice screen - user picks how they want to sign up
  if (authMethod === 'choice') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                Create your account
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Choose how you'd like to sign up
              </p>
            </div>

            <div className="space-y-4">
              {/* Social Login Option */}
              <button
                onClick={() => setAuthMethod('social')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
                  <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-surface-900 dark:text-white">
                    Continue with Social Account
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Sign up with Google or LinkedIn
                  </p>
                </div>
              </button>

              {/* Email Login Option */}
              <button
                onClick={() => setAuthMethod('email')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center group-hover:bg-surface-200 dark:group-hover:bg-surface-600 transition-colors">
                  <Mail className="w-6 h-6 text-surface-600 dark:text-surface-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-surface-900 dark:text-white">
                    Continue with Email
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Sign up with your email address
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700 text-center">
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Already have an account?{' '}
                <a href="/auth" className="text-primary-500 hover:text-primary-600 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Social signup flow
  if (authMethod === 'social') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
        <div className="w-full max-w-md overflow-visible">
          <button
            onClick={() => setAuthMethod('choice')}
            className="mb-4 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 flex items-center gap-1"
          >
            ← Back to options
          </button>
          <SignUp
            appearance={{
              elements: {
                rootBox: 'mx-auto w-full overflow-visible',
                card: 'bg-white dark:bg-surface-800 shadow-lg overflow-visible',
                cardBox: 'overflow-visible',
                main: 'overflow-visible',
                form: 'hidden', // Hide the email form
                dividerRow: 'hidden', // Hide the "or" divider
                headerTitle: 'text-surface-900 dark:text-white',
                headerSubtitle: 'text-surface-600 dark:text-surface-400',
                socialButtonsBlockButton:
                  'bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 border-surface-300 dark:border-surface-600',
                socialButtonsBlockButtonText: 'text-surface-900 dark:text-white',
                footerActionLink: 'text-primary-500 hover:text-primary-600',
                footer: 'overflow-visible',
              },
            }}
            routing="path"
            path="/signup"
            signInUrl="/auth"
            fallbackRedirectUrl="/auth/complete-signup"
          />
          <div className="mt-4 text-center">
            <button
              onClick={() => setAuthMethod('email')}
              className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500"
            >
              Or sign up with email instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email signup flow
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
      <div className="w-full max-w-md overflow-visible">
        <button
          onClick={() => setAuthMethod('choice')}
          className="mb-4 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 flex items-center gap-1"
        >
          ← Back to options
        </button>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto w-full overflow-visible',
              card: 'bg-white dark:bg-surface-800 shadow-lg overflow-visible',
              cardBox: 'overflow-visible',
              main: 'overflow-visible',
              form: 'overflow-visible',
              socialButtonsBlockButton: 'hidden', // Hide social buttons
              socialButtonsProviderIcon: 'hidden',
              dividerRow: 'hidden', // Hide the "or" divider
              headerTitle: 'text-surface-900 dark:text-white',
              headerSubtitle: 'text-surface-600 dark:text-surface-400',
              formFieldLabel: 'text-surface-700 dark:text-surface-300',
              formFieldInput:
                'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600 text-surface-900 dark:text-white',
              footerActionLink: 'text-primary-500 hover:text-primary-600',
              formButtonPrimary:
                'bg-primary-500 hover:bg-primary-600 text-white',
              footer: 'overflow-visible',
            },
          }}
          routing="path"
          path="/signup"
          signInUrl="/auth"
          fallbackRedirectUrl="/auth/complete-signup"
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => setAuthMethod('social')}
            className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500"
          >
            Or sign up with Google/LinkedIn instead
          </button>
        </div>
      </div>
    </div>
  );
}
