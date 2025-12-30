'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, GraduationCap, Building } from 'lucide-react';
import type { User as DBUser } from '@/lib/types/database';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [qualification, setQualification] = useState('');
  const [university, setUniversity] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setDiscipline(data.discipline || '');
        setQualification(data.qualification || '');
        setUniversity(data.university || '');
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        discipline,
        qualification,
        university: university || null,
      })
      .eq('id', profile.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Profile updated successfully!');
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 py-8">
      <h1 className="h2 mb-8">Your Profile</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-green-500">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700">
            {profile?.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-surface-500" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-surface-500">{profile?.email}</p>
          </div>
        </div>

        {/* Name */}
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
              required
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="mb-2 block text-sm font-medium">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
            <input
              type="email"
              value={profile?.email || ''}
              className="input pl-10 opacity-60"
              disabled
            />
          </div>
          <p className="mt-1 text-sm text-surface-500">
            Email cannot be changed
          </p>
        </div>

        {/* Discipline */}
        <div>
          <label htmlFor="discipline" className="mb-2 block text-sm font-medium">
            Field of Study / Expertise
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
            <select
              id="discipline"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="input pl-10"
            >
              <option value="">Select your field</option>
              <option value="Geology">Geology</option>
              <option value="Petroleum Engineering">Petroleum Engineering</option>
              <option value="Geophysics">Geophysics</option>
              <option value="Environmental Science">Environmental Science</option>
              <option value="Mining Engineering">Mining Engineering</option>
              <option value="Other">Other</option>
            </select>
          </div>
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
          >
            <option value="">Select your level</option>
            <option value="100-level Student">100-level Student</option>
            <option value="200-level Student">200-level Student</option>
            <option value="300-level Student">300-level Student</option>
            <option value="400-level Student">400-level Student</option>
            <option value="500-level Student">500-level Student</option>
            <option value="Graduate">Graduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Working Professional">Working Professional</option>
          </select>
        </div>

        {/* University */}
        <div>
          <label htmlFor="university" className="mb-2 block text-sm font-medium">
            University / Organization
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
            <input
              id="university"
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="input pl-10"
              placeholder="Enter your university or organization"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary w-full"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
