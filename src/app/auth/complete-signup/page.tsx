'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, ChevronLeft, GraduationCap, Briefcase } from 'lucide-react';

// Step 1: Role selection
const roles = [
  { id: 'student', label: 'Student / Mentee', icon: '🎓', description: 'I want to learn and be mentored' },
  { id: 'mentor', label: 'Mentor', icon: '👨‍🏫', description: 'I want to guide and mentor others' },
];

// Step 2: Discipline options
const disciplines = [
  { id: 'Geology', label: 'Geology', icon: '🪨', active: true },
  { id: 'Petroleum Engineering', label: 'Petroleum Engineering', icon: '🛢️', active: true },
  { id: 'Geophysics', label: 'Geophysics', icon: '🌍', active: true },
  { id: 'Environmental Science', label: 'Environmental Science', icon: '🌱', active: true },
  { id: 'Mining Engineering', label: 'Mining Engineering', icon: '⛏️', active: true },
  { id: 'Other', label: 'Other', icon: '📚', active: true },
];

// Step 3: Qualification options
const qualifications = [
  { id: '100-level Student', label: '100-level Student', category: 'student' },
  { id: '200-level Student', label: '200-level Student', category: 'student' },
  { id: '300-level Student', label: '300-level Student', category: 'student' },
  { id: '400-level Student', label: '400-level Student', category: 'student' },
  { id: '500-level Student', label: '500-level Student', category: 'student' },
  { id: 'Graduate', label: 'Graduate', category: 'graduate' },
  { id: 'Postgraduate', label: 'Postgraduate', category: 'graduate' },
  { id: 'Working Professional', label: 'Working Professional', category: 'professional' },
];

function CompleteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Get initial role from URL
  const initialRole = searchParams.get('role') === 'mentor' ? 'mentor' : 'student';

  // Wizard state
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<string>(initialRole);
  const [discipline, setDiscipline] = useState('');
  const [qualification, setQualification] = useState('');
  const [university, setUniversity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/auth');
    }
  }, [isLoaded, user, router]);

  // Check if profile already complete
  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.profile?.discipline && data.profile?.qualification && data.profile?.role) {
            router.push('/dashboard');
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, user, router]);

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleDisciplineSelect = (selectedDiscipline: string) => {
    setDiscipline(selectedDiscipline);
    setStep(3);
  };

  const handleQualificationSelect = (selectedQualification: string) => {
    setQualification(selectedQualification);
    setStep(4);
  };

  const handleComplete = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline,
          qualification,
          role,
          university: university || null,
        }),
      });

      if (response.ok) {
        // Redirect mentors to the application page, students to dashboard
        if (role === 'mentor') {
          router.push('/mentors/apply');
        } else {
          router.push('/dashboard');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save profile');
        setSaving(false);
      }
    } catch {
      setError('Failed to save profile');
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Progress indicator
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full rounded-full bg-surface-200 dark:bg-surface-700">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-sm text-surface-500">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Back button */}
        {step > 1 && (
          <button
            onClick={goBack}
            className="mb-4 flex items-center gap-1 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}

        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  Welcome to mentor.energy!
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Are you joining as a...
                </p>
              </div>

              <div className="grid gap-4">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleSelect(r.id)}
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                      role === r.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="text-4xl">{r.icon}</div>
                    <div className="text-left">
                      <p className="font-semibold text-surface-900 dark:text-white">
                        {r.label}
                      </p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {r.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Discipline Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  What's your field of interest?
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Select your primary discipline
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {disciplines.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => d.active && handleDisciplineSelect(d.id)}
                    disabled={!d.active}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      !d.active
                        ? 'opacity-50 cursor-not-allowed border-surface-200 dark:border-surface-700'
                        : discipline === d.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="text-3xl mb-2">{d.icon}</div>
                    <p className="font-medium text-surface-900 dark:text-white text-sm">
                      {d.label}
                    </p>
                    {!d.active && (
                      <p className="text-xs text-surface-400 mt-1">Coming soon</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Qualification Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  What's your current level?
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Select your qualification or current status
                </p>
              </div>

              <div className="space-y-3">
                {/* Students */}
                <div>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Students
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {qualifications.filter(q => q.category === 'student').map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleQualificationSelect(q.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          qualification === q.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Graduates */}
                <div>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Graduates
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {qualifications.filter(q => q.category === 'graduate').map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleQualificationSelect(q.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          qualification === q.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Professionals */}
                <div>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Professionals
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {qualifications.filter(q => q.category === 'professional').map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleQualificationSelect(q.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          qualification === q.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: University (Optional) & Complete */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  Almost done!
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Where are you studying or working? (Optional)
                </p>
              </div>

              {role === 'mentor' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Next step:</strong> After completing your profile, you'll be directed to the mentor application form where you can share your experience and expertise.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="bg-surface-50 dark:bg-surface-900/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Role:</span>
                  <span className="font-medium text-surface-900 dark:text-white capitalize">{role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Discipline:</span>
                  <span className="font-medium text-surface-900 dark:text-white">{discipline}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Level:</span>
                  <span className="font-medium text-surface-900 dark:text-white">{qualification}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  University / Organization
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g., University of Lagos"
                  className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleComplete}
                disabled={saving}
                className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : role === 'mentor' ? (
                  'Continue to Mentor Application'
                ) : (
                  'Complete Profile'
                )}
              </button>

              {role !== 'mentor' && (
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="w-full py-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                >
                  Skip for now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CompleteSignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    }>
      <CompleteSignupContent />
    </Suspense>
  );
}
