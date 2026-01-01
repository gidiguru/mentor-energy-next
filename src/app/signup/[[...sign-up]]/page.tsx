'use client';

import { useSignUp } from '@clerk/nextjs';
import { Suspense, useState } from 'react';
import { Mail, Users, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getErrorMessage } from '@/lib/auth';

type AuthMethod = 'choice' | 'social' | 'email';

function SignUpPageContent() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('choice');
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get role from URL (e.g., /signup?role=student or /signup?role=mentor)
  const role = searchParams.get('role');
  const completeSignupUrl = role
    ? `/auth/complete-signup?role=${role}`
    : '/auth/complete-signup';

  // Email form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleSocialSignUp = async (provider: 'oauth_google' | 'oauth_linkedin_oidc') => {
    if (!isLoaded || !signUp) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/auth/sso-callback',
        redirectUrlComplete: completeSignupUrl,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        router.push(completeSignupUrl);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid verification code'));
    } finally {
      setLoading(false);
    }
  };

  // Choice screen
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
              <button
                onClick={() => setAuthMethod('social')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
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

              <button
                onClick={() => setAuthMethod('email')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
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
        <div className="w-full max-w-md">
          <button
            onClick={() => setAuthMethod('choice')}
            className="mb-4 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 flex items-center gap-1"
          >
            ← Back to options
          </button>

          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                Sign up with Social
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Choose your preferred provider
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleSocialSignUp('oauth_google')}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 hover:bg-surface-50 dark:hover:bg-surface-600 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-surface-900 dark:text-white font-medium">Continue with Google</span>
              </button>

              <button
                onClick={() => handleSocialSignUp('oauth_linkedin_oidc')}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 hover:bg-surface-50 dark:hover:bg-surface-600 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-surface-900 dark:text-white font-medium">Continue with LinkedIn</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMethod('email')}
                className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500"
              >
                Or sign up with email instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Email verification screen
  if (pendingVerification) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                Verify your email
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                We sent a code to {email}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify Email
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Email signup form
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <button
          onClick={() => setAuthMethod('choice')}
          className="mb-4 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 flex items-center gap-1"
        >
          ← Back to options
        </button>

        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
              Sign up with Email
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Create your account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMethod('social')}
              className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500"
            >
              Or sign up with Google/LinkedIn instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center">Loading...</div>}>
      <SignUpPageContent />
    </Suspense>
  );
}
