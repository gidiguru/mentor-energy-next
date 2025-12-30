'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Linkedin, Eye, EyeOff, User, Check, X } from 'lucide-react';

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const passwordValidation: PasswordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setEmailSent(true);
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError('Failed to sign up with Google');
      setLoading(false);
    }
  }

  async function handleLinkedInSignUp() {
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError('Failed to sign up with LinkedIn');
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="container mx-auto max-w-md p-4 py-8">
        <div className="card p-6 text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h2 className="h2 mb-4">Check Your Email</h2>
          <p className="mb-6 text-surface-600 dark:text-surface-400">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Please click the link to verify your account.
          </p>
          <Link href="/auth" className="btn btn-primary">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="h2 mb-2">Create Your Account</h1>
          <p className="text-surface-600 dark:text-surface-400">
            Join mentor.energy and start your journey
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-red-500">
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLinkedInSignUp}
            disabled={loading}
            className="btn w-full gap-2 bg-[#0A66C2] text-white hover:bg-[#004182]"
          >
            <Linkedin className="h-5 w-5" />
            Sign up with LinkedIn
          </button>

          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="btn btn-secondary w-full gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            Sign up with Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-300 dark:border-surface-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 dark:bg-surface-900">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Email Sign Up Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input pl-10"
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!firstName || !lastName || !email}
                className="btn btn-primary w-full"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password requirements */}
                <div className="mt-2 space-y-1 text-sm">
                  {Object.entries({
                    'At least 8 characters': passwordValidation.minLength,
                    'One uppercase letter': passwordValidation.hasUppercase,
                    'One lowercase letter': passwordValidation.hasLowercase,
                    'One number': passwordValidation.hasNumber,
                    'One special character': passwordValidation.hasSpecial,
                  }).map(([label, valid]) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 ${
                        valid ? 'text-green-500' : 'text-surface-500'
                      }`}
                    >
                      {valid ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Confirm your password"
                  required
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-sm text-red-500">
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-ghost flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !isPasswordValid || !passwordsMatch}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth" className="text-primary-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
