'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, CheckCircle, Clock, XCircle, Plus, Trash2 } from 'lucide-react';

const expertiseOptions = [
  'Petroleum Geology',
  'Reservoir Engineering',
  'Drilling Engineering',
  'Production Engineering',
  'Geophysics',
  'Seismic Interpretation',
  'Well Logging',
  'Petrophysics',
  'Environmental Science',
  'Health & Safety (HSE)',
  'Project Management',
  'Data Analysis',
  'Research & Development',
  'Academic/Teaching',
  'Policy & Regulation',
];

export default function MentorApplicationPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bio: '',
    expertise: [] as string[],
    customExpertise: '',
    yearsExperience: '',
    currentRole: '',
    company: '',
    linkedinUrl: '',
    motivation: '',
    availability: '',
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth');
      return;
    }

    if (isSignedIn) {
      checkStatus();
    }
  }, [isSignedIn, isLoaded, router]);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/mentor/apply');
      const data = await res.json();
      setStatus(data.status || 'none');
      if (data.isMentor) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpertise = (area: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(area)
        ? prev.expertise.filter(e => e !== area)
        : [...prev.expertise, area],
    }));
  };

  const addCustomExpertise = () => {
    if (formData.customExpertise.trim() && !formData.expertise.includes(formData.customExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, prev.customExpertise.trim()],
        customExpertise: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/mentor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: formData.bio,
          expertise: formData.expertise,
          yearsExperience: parseInt(formData.yearsExperience),
          currentRole: formData.currentRole,
          company: formData.company || null,
          linkedinUrl: formData.linkedinUrl || null,
          motivation: formData.motivation || null,
          availability: formData.availability || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setStatus('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Show status if already applied
  if (status !== 'none') {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 text-center">
            {status === 'pending' && (
              <>
                <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  Application Under Review
                </h2>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Your mentor application is being reviewed by our team. We&apos;ll notify you once a decision is made.
                </p>
              </>
            )}
            {status === 'approved' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  You&apos;re a Mentor!
                </h2>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Your application has been approved. Welcome to the mentor community!
                </p>
              </>
            )}
            {status === 'rejected' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  Application Not Approved
                </h2>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Unfortunately, your application wasn&apos;t approved at this time. You can apply again in the future.
                </p>
              </>
            )}
            <Link
              href="/mentors"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Mentors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href="/mentors"
          className="inline-flex items-center text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mentors
        </Link>

        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 md:p-8 border border-surface-200 dark:border-surface-700">
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
            Become a Mentor
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-8">
            Share your expertise and help shape the next generation of energy professionals in Nigeria.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Professional Bio *
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                required
                rows={4}
                placeholder="Tell us about your professional background and experience..."
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Current Role & Company */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Current Role *
                </label>
                <input
                  type="text"
                  value={formData.currentRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentRole: e.target.value }))}
                  required
                  placeholder="e.g., Senior Geologist"
                  className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g., Shell Nigeria"
                  className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Years Experience */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Years of Experience *
              </label>
              <input
                type="number"
                min="1"
                value={formData.yearsExperience}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                required
                placeholder="5"
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Expertise Areas */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Areas of Expertise * (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {expertiseOptions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleExpertise(area)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      formData.expertise.includes(area)
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              {/* Custom expertise */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.customExpertise}
                  onChange={(e) => setFormData(prev => ({ ...prev, customExpertise: e.target.value }))}
                  placeholder="Add custom expertise..."
                  className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addCustomExpertise}
                  className="px-4 py-2 bg-surface-200 dark:bg-surface-600 hover:bg-surface-300 dark:hover:bg-surface-500 rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {/* Selected custom items */}
              {formData.expertise.filter(e => !expertiseOptions.includes(e)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.expertise.filter(e => !expertiseOptions.includes(e)).map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1.5 rounded-full text-sm bg-primary-600 text-white flex items-center gap-1"
                    >
                      {area}
                      <button type="button" onClick={() => toggleExpertise(area)}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {formData.expertise.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Please select at least one area of expertise</p>
              )}
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Why do you want to be a mentor?
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                rows={3}
                placeholder="Share what motivates you to mentor others..."
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Expected Availability
              </label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select availability</option>
                <option value="1-2 hours/week">1-2 hours/week</option>
                <option value="3-5 hours/week">3-5 hours/week</option>
                <option value="5-10 hours/week">5-10 hours/week</option>
                <option value="10+ hours/week">10+ hours/week</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || formData.expertise.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
