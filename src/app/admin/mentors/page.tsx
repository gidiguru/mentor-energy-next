'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, UserX, UserCheck, Loader2, Search,
  Briefcase, Star, Calendar, Users
} from 'lucide-react';

interface Mentor {
  id: string;
  userId: string;
  bio: string | null;
  expertise: string[] | null;
  yearsExperience: number | null;
  currentRole: string | null;
  company: string | null;
  isAvailable: boolean;
  isVerified: boolean;
  sessionCount: number;
  averageRating: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
    role: string;
  } | null;
}

export default function ManageMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const res = await fetch('/api/admin/mentors');
      const data = await res.json();
      setMentors(data.mentors || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedMentor) return;

    setActionLoading(selectedMentor.id);
    try {
      const res = await fetch(`/api/admin/mentors/${selectedMentor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', reason: revokeReason }),
      });

      if (res.ok) {
        await fetchMentors();
        setShowRevokeModal(false);
        setSelectedMentor(null);
        setRevokeReason('');
      }
    } catch (error) {
      console.error('Error revoking mentor:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinstate = async (mentor: Mentor) => {
    setActionLoading(mentor.id);
    try {
      const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reinstate' }),
      });

      if (res.ok) {
        await fetchMentors();
      }
    } catch (error) {
      console.error('Error reinstating mentor:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredMentors = mentors.filter((mentor) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      mentor.user?.name.toLowerCase().includes(searchLower) ||
      mentor.user?.email.toLowerCase().includes(searchLower) ||
      mentor.currentRole?.toLowerCase().includes(searchLower) ||
      mentor.company?.toLowerCase().includes(searchLower)
    );
  });

  const activeMentors = filteredMentors.filter((m) => m.user?.role === 'mentor');
  const revokedMentors = filteredMentors.filter((m) => m.user?.role !== 'mentor');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
          Manage Mentors
        </h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          View, revoke, or reinstate mentor status
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {activeMentors.length}
              </p>
              <p className="text-sm text-surface-500">Active Mentors</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {revokedMentors.length}
              </p>
              <p className="text-sm text-surface-500">Revoked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Mentors List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <Users className="w-12 h-12 text-surface-400 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">No mentors found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMentors.map((mentor) => {
            const isActive = mentor.user?.role === 'mentor';

            return (
              <div
                key={mentor.id}
                className={`bg-white dark:bg-surface-800 rounded-xl p-6 border ${
                  isActive
                    ? 'border-surface-200 dark:border-surface-700'
                    : 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {mentor.user?.profilePicture ? (
                      <Image
                        src={mentor.user.profilePicture}
                        alt={mentor.user.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg text-primary-600">
                        {mentor.user?.name.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-surface-900 dark:text-white">
                          {mentor.user?.name || 'Unknown'}
                        </h3>
                        {!isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs">
                            Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-500">{mentor.user?.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-surface-600 dark:text-surface-400">
                        {mentor.currentRole && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {mentor.currentRole} {mentor.company && `at ${mentor.company}`}
                          </span>
                        )}
                        {mentor.averageRating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            {parseFloat(mentor.averageRating).toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {mentor.sessionCount} sessions
                        </span>
                      </div>
                      {mentor.expertise && mentor.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {mentor.expertise.slice(0, 4).map((e) => (
                            <span key={e} className="px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-xs">
                              {e}
                            </span>
                          ))}
                          {mentor.expertise.length > 4 && (
                            <span className="text-xs text-surface-500">+{mentor.expertise.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <button
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowRevokeModal(true);
                        }}
                        disabled={actionLoading === mentor.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                      >
                        {actionLoading === mentor.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReinstate(mentor)}
                        disabled={actionLoading === mentor.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                      >
                        {actionLoading === mentor.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-surface-500 mt-4">
                  Mentor since {formatDate(mentor.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">
              Revoke Mentor Status
            </h3>

            <p className="text-surface-600 dark:text-surface-400 mb-4">
              Are you sure you want to revoke mentor status for <strong>{selectedMentor.user?.name}</strong>?
            </p>

            <p className="text-sm text-surface-500 mb-4">
              This will:
            </p>
            <ul className="text-sm text-surface-500 list-disc list-inside mb-6 space-y-1">
              <li>Change their role back to mentee</li>
              <li>Hide their mentor profile from mentees</li>
              <li>Send them an email notification</li>
            </ul>

            <div className="mb-6">
              <label className="block font-medium text-surface-700 dark:text-surface-300 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                placeholder="Explain why mentor status is being revoked..."
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setSelectedMentor(null);
                  setRevokeReason('');
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={actionLoading === selectedMentor.id}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                {actionLoading === selectedMentor.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UserX className="w-5 h-5" />
                )}
                Revoke Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
