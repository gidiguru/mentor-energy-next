'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const disciplines = [
  'Geology',
  'Petroleum Engineering',
  'Geophysics',
  'Environmental Science',
  'Mining Engineering',
  'Other',
];

const qualifications = [
  '100-level Student',
  '200-level Student',
  '300-level Student',
  '400-level Student',
  '500-level Student',
  'Graduate',
  'Postgraduate',
  'Working Professional',
];

const roles = ['student', 'mentor'] as const;

export default function CompleteSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const [discipline, setDiscipline] = useState('');
  const [qualification, setQualification] = useState('');
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [university, setUniversity] = useState('');

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      setUserId(user.id);
      setLoading(false);
    }

    checkUser();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        discipline,
        qualification,
        role,
        university: university || null,
      })
      .eq('id', userId);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push('/dashboard');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="h2 mb-2">Complete Your Profile</h1>
          <p className="text-surface-600 dark:text-surface-400">
            Tell us a bit more about yourself
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="mb-3 block text-sm font-medium">
              I am joining as a
            </label>
            <div className="grid grid-cols-2 gap-4">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`card p-4 text-center transition-colors ${
                    role === r
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'hover:border-surface-400'
                  }`}
                >
                  <div className="mb-2 text-3xl">
                    {r === 'student' ? '🎓' : '👨‍🏫'}
                  </div>
                  <div className="font-medium capitalize">{r}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Discipline */}
          <div>
            <label htmlFor="discipline" className="mb-2 block text-sm font-medium">
              Field of Study / Expertise
            </label>
            <select
              id="discipline"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="input"
              required
            >
              <option value="">Select your field</option>
              {disciplines.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Qualification */}
          <div>
            <label htmlFor="qualification" className="mb-2 block text-sm font-medium">
              Current Level / Qualification
            </label>
            <select
              id="qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="input"
              required
            >
              <option value="">Select your level</option>
              {qualifications.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* University (optional) */}
          <div>
            <label htmlFor="university" className="mb-2 block text-sm font-medium">
              University / Organization (optional)
            </label>
            <input
              id="university"
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="input"
              placeholder="Enter your university or organization"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !discipline || !qualification}
            className="btn btn-primary w-full"
          >
            {saving ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
