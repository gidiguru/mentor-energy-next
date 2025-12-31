'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, Star, Briefcase, MapPin, Linkedin, MessageSquare, Calendar, Loader2, UserPlus, CheckCircle } from 'lucide-react';

interface Mentor {
  id: string;
  userId: string;
  name: string;
  profilePicture: string | null;
  bio: string | null;
  expertise: string[];
  specializations: string[];
  yearsExperience: number | null;
  currentRole: string | null;
  company: string | null;
  discipline: string | null;
  linkedinUrl: string | null;
  sessionCount: number;
  averageRating: number | null;
  isAvailable: boolean;
}

interface Connection {
  id: string;
  status: string;
  mentor: { id: string };
}

export default function MentorsPage() {
  const { isSignedIn } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState<Mentor | null>(null);
  const [connectMessage, setConnectMessage] = useState('');

  useEffect(() => {
    fetchMentors();
    if (isSignedIn) {
      fetchConnections();
    }
  }, [isSignedIn]);

  const fetchMentors = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (expertiseFilter) params.append('expertise', expertiseFilter);

      const res = await fetch(`/api/mentors?${params}`);
      const data = await res.json();
      setMentors(data.mentors || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/mentor/connections');
      const data = await res.json();
      setConnections(data.asStudent || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const getConnectionStatus = (mentorId: string) => {
    const conn = connections.find(c => c.mentor.id === mentorId);
    return conn?.status || null;
  };

  const handleConnect = async (mentor: Mentor) => {
    if (!isSignedIn) {
      window.location.href = '/auth';
      return;
    }

    setShowConnectModal(mentor);
  };

  const submitConnectionRequest = async () => {
    if (!showConnectModal) return;

    setConnecting(showConnectModal.id);
    try {
      const res = await fetch('/api/mentor/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: showConnectModal.id,
          message: connectMessage,
        }),
      });

      if (res.ok) {
        await fetchConnections();
        setShowConnectModal(null);
        setConnectMessage('');
      }
    } catch (error) {
      console.error('Error sending connection:', error);
    } finally {
      setConnecting(null);
    }
  };

  // Get unique expertise areas for filter
  const expertiseAreas = [...new Set(mentors.flatMap(m => m.expertise))].sort();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-4">
            Find Your Mentor
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-surface-600 dark:text-surface-400">
            Connect with experienced professionals in Nigeria&apos;s energy sector.
            Our mentors are here to guide your career journey.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMentors()}
              placeholder="Search by name, role, or company..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={expertiseFilter}
              onChange={(e) => {
                setExpertiseFilter(e.target.value);
                fetchMentors();
              }}
              className="px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Expertise</option>
              {expertiseAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <button
              onClick={fetchMentors}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-surface-600 dark:text-surface-400">No mentors found matching your criteria.</p>
          </div>
        ) : (
          /* Mentors Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mentors.map((mentor) => {
              const connectionStatus = getConnectionStatus(mentor.id);

              return (
                <div key={mentor.id} className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 hover:shadow-lg transition-shadow">
                  {/* Profile Picture */}
                  <div className="mb-4 flex justify-center">
                    {mentor.profilePicture ? (
                      <Image
                        src={mentor.profilePicture}
                        alt={mentor.name}
                        width={80}
                        height={80}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl text-primary-600">
                        {mentor.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name and Role */}
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white text-center mb-1">
                    {mentor.name}
                  </h3>
                  {mentor.currentRole && (
                    <p className="text-primary-600 text-center text-sm">{mentor.currentRole}</p>
                  )}
                  {mentor.company && (
                    <p className="text-surface-500 text-center text-sm mb-3">{mentor.company}</p>
                  )}

                  {/* Stats */}
                  <div className="flex justify-center gap-4 mb-4 text-sm text-surface-600 dark:text-surface-400">
                    {mentor.yearsExperience && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {mentor.yearsExperience}+ yrs
                      </span>
                    )}
                    {mentor.averageRating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {mentor.averageRating.toFixed(1)}
                      </span>
                    )}
                    {mentor.sessionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {mentor.sessionCount}
                      </span>
                    )}
                  </div>

                  {/* Expertise Tags */}
                  <div className="mb-4 flex flex-wrap justify-center gap-2">
                    {mentor.expertise.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-surface-100 dark:bg-surface-700 px-2 py-1 text-xs text-surface-700 dark:text-surface-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <span className="text-xs text-surface-500">+{mentor.expertise.length - 3}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {mentor.linkedinUrl && (
                      <a
                        href={mentor.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700"
                      >
                        <Linkedin className="w-5 h-5 text-blue-600" />
                      </a>
                    )}
                    <button
                      onClick={() => handleConnect(mentor)}
                      disabled={connectionStatus === 'pending' || connectionStatus === 'accepted'}
                      className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                        connectionStatus === 'accepted'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : connectionStatus === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {connectionStatus === 'accepted' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Connected
                        </>
                      ) : connectionStatus === 'pending' ? (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Pending
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            Want to become a mentor?
          </h2>
          <p className="mb-6 text-surface-600 dark:text-surface-400 max-w-xl mx-auto">
            Share your expertise and help shape the next generation of professionals in Nigeria&apos;s energy sector.
          </p>
          <Link
            href="/mentors/apply"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Apply as Mentor
          </Link>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              Connect with {showConnectModal.name}
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-4 text-sm">
              Send a connection request with a message introducing yourself.
            </p>

            <textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value)}
              placeholder="Hi! I'm interested in connecting with you because..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConnectModal(null);
                  setConnectMessage('');
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Cancel
              </button>
              <button
                onClick={submitConnectionRequest}
                disabled={connecting === showConnectModal.id}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium flex items-center justify-center gap-2"
              >
                {connecting === showConnectModal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
