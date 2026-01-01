'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { User, Mail, GraduationCap, Building, Lock, Users, Award, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  discipline: string | null;
  qualification: string | null;
  university: string | null;
  role: string;
}

interface MentoringStats {
  connectionsAsMentor: number;
  connectionsAsStudent: number;
  pendingRequests: number;
  acceptedConnections: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [mentoringStats, setMentoringStats] = useState<MentoringStats>({
    connectionsAsMentor: 0,
    connectionsAsStudent: 0,
    pendingRequests: 0,
    acceptedConnections: 0,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [qualification, setQualification] = useState('');
  const [university, setUniversity] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!isLoaded) return;

      if (!user) {
        router.push('/auth');
        return;
      }

      try {
        // Fetch profile and connections in parallel
        const [profileRes, connectionsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/mentor/connections'),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.profile) {
            setProfile(data.profile);
            setFirstName(data.profile.first_name || '');
            setLastName(data.profile.last_name || '');
            setDiscipline(data.profile.discipline || '');
            setQualification(data.profile.qualification || '');
            setUniversity(data.profile.university || '');
          } else if (data.clerkUser) {
            // Use Clerk user info as defaults
            setFirstName(data.clerkUser.firstName || '');
            setLastName(data.clerkUser.lastName || '');
          }
          setIsMentor(data.isMentor || false);
        }

        if (connectionsRes.ok) {
          const connData = await connectionsRes.json();
          const asMentor = connData.asMentor || [];
          const asStudent = connData.asStudent || [];

          setMentoringStats({
            connectionsAsMentor: asMentor.length,
            connectionsAsStudent: asStudent.length,
            pendingRequests: asMentor.filter((c: { status: string }) => c.status === 'pending').length,
            acceptedConnections: isMentor
              ? asMentor.filter((c: { status: string }) => c.status === 'accepted').length
              : asStudent.filter((c: { status: string }) => c.status === 'accepted').length,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }

      setLoading(false);
    }

    loadProfile();
  }, [user, isLoaded, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: profile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          discipline,
          qualification,
          university: university || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setSuccess('Profile updated successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to save profile');
    }

    setSaving(false);
  }

  if (loading || !isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  const userEmail = profile?.email || user?.emailAddresses[0]?.emailAddress || '';
  const profilePicture = user?.imageUrl;
  const displayFirstName = firstName || user?.firstName || '';
  const displayLastName = lastName || user?.lastName || '';

  return (
    <div className="container mx-auto max-w-2xl p-4 py-8">
      {/* Header with name */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-surface-500" />
          )}
        </div>
        <div>
          <h1 className="h2">
            {displayFirstName} {displayLastName}
          </h1>
          <p className="text-surface-500">{profile?.role === 'mentor' ? 'Mentor' : 'Student'}</p>
        </div>
      </div>

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
              value={userEmail}
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

      {/* Mentoring Status Section */}
      <div className="mt-8 border-t border-surface-200 pt-8 dark:border-surface-700">
        <h2 className="h3 mb-4">Mentoring Status</h2>

        {/* Status Badge */}
        <div className="card preset-filled-surface-100-900 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMentor ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <Award className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Verified Mentor</p>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-sm text-surface-500">
                      You can mentor students on the platform
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/20">
                    <Users className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium">Student / Mentee</p>
                    <p className="text-sm text-surface-500">
                      Connect with mentors to accelerate your learning
                    </p>
                  </div>
                </>
              )}
            </div>
            <Link
              href={isMentor ? '/dashboard/mentoring' : '/mentors'}
              className="btn btn-ghost"
            >
              {isMentor ? 'Manage' : 'Find Mentors'}
            </Link>
          </div>
        </div>

        {/* Mentoring Stats */}
        <div className="grid grid-cols-2 gap-4">
          {isMentor ? (
            <>
              <div className="card preset-filled-surface-100-900 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary-500">
                  <Users className="h-6 w-6" />
                  {mentoringStats.connectionsAsMentor}
                </div>
                <p className="text-sm text-surface-500">Total Mentees</p>
              </div>
              <div className="card preset-filled-surface-100-900 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-500">
                  <Clock className="h-6 w-6" />
                  {mentoringStats.pendingRequests}
                </div>
                <p className="text-sm text-surface-500">Pending Requests</p>
              </div>
            </>
          ) : (
            <>
              <div className="card preset-filled-surface-100-900 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary-500">
                  <Users className="h-6 w-6" />
                  {mentoringStats.connectionsAsStudent}
                </div>
                <p className="text-sm text-surface-500">My Mentors</p>
              </div>
              <div className="card preset-filled-surface-100-900 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-500">
                  <CheckCircle className="h-6 w-6" />
                  {mentoringStats.acceptedConnections}
                </div>
                <p className="text-sm text-surface-500">Active Connections</p>
              </div>
            </>
          )}
        </div>

        {/* Become a Mentor CTA for students */}
        {!isMentor && (
          <div className="mt-4 card preset-outlined-primary-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Want to become a mentor?</p>
                <p className="text-sm text-surface-500">
                  Share your expertise and help others grow
                </p>
              </div>
              <Link href="/mentors/apply" className="btn btn-primary">
                Apply Now
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="mt-8 border-t border-surface-200 pt-8 dark:border-surface-700">
        <h2 className="h3 mb-4">Security</h2>
        <div className="card preset-filled-surface-100-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-surface-500" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-surface-500">
                  Change your password or manage security settings
                </p>
              </div>
            </div>
            <button
              onClick={() => openUserProfile()}
              className="btn btn-ghost"
            >
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
