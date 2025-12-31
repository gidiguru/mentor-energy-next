'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Loader2, Filter,
  Briefcase, Calendar, ExternalLink, User
} from 'lucide-react';

interface Application {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  bio: string;
  expertise: string[];
  yearsExperience: number;
  currentRole: string;
  company: string | null;
  linkedinUrl: string | null;
  motivation: string | null;
  availability: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  };
}

export default function MentorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/admin/mentor-applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (appId: string, status: 'approved' | 'rejected') => {
    setReviewing(appId);
    try {
      const res = await fetch(`/api/admin/mentor-applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes }),
      });

      if (res.ok) {
        await fetchApplications();
        setSelectedApp(null);
        setReviewNotes('');
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
    } finally {
      setReviewing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredApps = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  const statusCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

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
          Mentor Applications
        </h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {statusCounts.pending}
              </p>
              <p className="text-sm text-surface-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {statusCounts.approved}
              </p>
              <p className="text-sm text-surface-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {statusCounts.rejected}
              </p>
              <p className="text-sm text-surface-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
            }`}
          >
            {f} {f !== 'all' && `(${statusCounts[f]})`}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <User className="w-12 h-12 text-surface-400 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">No applications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {app.user.profilePicture ? (
                    <Image
                      src={app.user.profilePicture}
                      alt={app.user.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg text-primary-600">
                      {app.user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">
                      {app.user.name}
                    </h3>
                    <p className="text-sm text-surface-500">{app.user.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-surface-600 dark:text-surface-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {app.currentRole} {app.company && `at ${app.company}`}
                      </span>
                      <span>{app.yearsExperience}+ years</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {app.expertise.slice(0, 4).map((e) => (
                        <span key={e} className="px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-xs">
                          {e}
                        </span>
                      ))}
                      {app.expertise.length > 4 && (
                        <span className="text-xs text-surface-500">+{app.expertise.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {app.status === 'pending' ? (
                    <>
                      <span className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm">
                        Pending
                      </span>
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                      >
                        Review
                      </button>
                    </>
                  ) : app.status === 'approved' ? (
                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-surface-500 mt-4">
                Applied {formatDate(app.createdAt)}
                {app.reviewedAt && ` • Reviewed ${formatDate(app.reviewedAt)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">
              Review Application
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                {selectedApp.user.profilePicture ? (
                  <Image
                    src={selectedApp.user.profilePicture}
                    alt={selectedApp.user.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl text-primary-600">
                    {selectedApp.user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold text-surface-900 dark:text-white">
                    {selectedApp.user.name}
                  </h4>
                  <p className="text-surface-500">{selectedApp.user.email}</p>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-surface-700 dark:text-surface-300 mb-1">Role & Experience</h5>
                <p className="text-surface-600 dark:text-surface-400">
                  {selectedApp.currentRole} {selectedApp.company && `at ${selectedApp.company}`} • {selectedApp.yearsExperience}+ years
                </p>
              </div>

              <div>
                <h5 className="font-medium text-surface-700 dark:text-surface-300 mb-1">Bio</h5>
                <p className="text-surface-600 dark:text-surface-400">{selectedApp.bio}</p>
              </div>

              <div>
                <h5 className="font-medium text-surface-700 dark:text-surface-300 mb-1">Expertise</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.expertise.map((e) => (
                    <span key={e} className="px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-sm">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {selectedApp.motivation && (
                <div>
                  <h5 className="font-medium text-surface-700 dark:text-surface-300 mb-1">Motivation</h5>
                  <p className="text-surface-600 dark:text-surface-400">{selectedApp.motivation}</p>
                </div>
              )}

              {selectedApp.availability && (
                <div>
                  <h5 className="font-medium text-surface-700 dark:text-surface-300 mb-1">Availability</h5>
                  <p className="text-surface-600 dark:text-surface-400">{selectedApp.availability}</p>
                </div>
              )}

              {selectedApp.linkedinUrl && (
                <a
                  href={selectedApp.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  LinkedIn Profile
                </a>
              )}

              <div>
                <label className="block font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Review Notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this application..."
                  className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setReviewNotes('');
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedApp.id, 'rejected')}
                disabled={reviewing === selectedApp.id}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
              <button
                onClick={() => handleReview(selectedApp.id, 'approved')}
                disabled={reviewing === selectedApp.id}
                className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
              >
                {reviewing === selectedApp.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
