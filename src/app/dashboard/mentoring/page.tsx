'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users, Calendar, MessageSquare, Clock, CheckCircle, XCircle,
  Loader2, UserPlus, Video, ArrowRight, Star, Plus, Trash2, Settings
} from 'lucide-react';

interface Connection {
  id: string;
  status: string;
  message: string | null;
  mentorResponse: string | null;
  createdAt: string;
  student?: {
    id: string;
    name: string;
    profilePicture: string | null;
    discipline: string | null;
    bio: string | null;
  };
  mentor?: {
    id: string;
    name: string;
    profilePicture: string | null;
    currentRole: string | null;
  };
}

interface Session {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  topic: string | null;
  meetingUrl: string | null;
  rating?: number;
  mentorFeedback?: string | null;
  mentor?: { id: string; name: string; profilePicture: string | null; currentRole: string | null };
  student?: { id: string; name: string; profilePicture: string | null; discipline: string | null };
}

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MentoringDashboard() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isMentor, setIsMentor] = useState(false);
  const [connections, setConnections] = useState<{ asStudent: Connection[]; asMentor: Connection[] }>({
    asStudent: [],
    asMentor: [],
  });
  const [sessions, setSessions] = useState<{ asStudent: Session[]; asMentor: Session[] }>({
    asStudent: [],
    asMentor: [],
  });
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'sessions' | 'availability'>('connections');
  const [updatingConnection, setUpdatingConnection] = useState<string | null>(null);
  const [ratingSession, setRatingSession] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  // Availability form state
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
  const [savingSlot, setSavingSlot] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth');
      return;
    }

    if (isSignedIn) {
      fetchData();
    }
  }, [isSignedIn, isLoaded, router]);

  const fetchData = async () => {
    try {
      const [connRes, sessRes] = await Promise.all([
        fetch('/api/mentor/connections'),
        fetch('/api/mentor/sessions'),
      ]);

      const connData = await connRes.json();
      const sessData = await sessRes.json();

      setConnections({
        asStudent: connData.asStudent || [],
        asMentor: connData.asMentor || [],
      });
      setSessions({
        asStudent: sessData.asStudent || [],
        asMentor: sessData.asMentor || [],
      });
      setIsMentor(connData.isMentor || false);

      // Fetch availability if mentor
      if (connData.isMentor) {
        const availRes = await fetch('/api/mentor/availability');
        const availData = await availRes.json();
        setAvailability(availData.availability || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'declined', response?: string) => {
    setUpdatingConnection(connectionId);
    try {
      const res = await fetch(`/api/mentor/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, response }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating connection:', error);
    } finally {
      setUpdatingConnection(null);
    }
  };

  const handleAddAvailability = async () => {
    setSavingSlot(true);
    try {
      const res = await fetch('/api/mentor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot),
      });

      if (res.ok) {
        await fetchData();
        setShowAddSlot(false);
        setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
      }
    } catch (error) {
      console.error('Error adding availability:', error);
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteAvailability = async (slotId: string) => {
    try {
      const res = await fetch(`/api/mentor/availability/${slotId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAvailability(prev => prev.filter(s => s.id !== slotId));
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
    }
  };

  const handleRateSession = async (sessionId: string) => {
    if (selectedRating < 1 || selectedRating > 5) return;

    try {
      const res = await fetch(`/api/mentor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating }),
      });

      if (res.ok) {
        await fetchData();
        setRatingSession(null);
        setSelectedRating(0);
      }
    } catch (error) {
      console.error('Error rating session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const pendingMentorConnections = connections.asMentor.filter(c => c.status === 'pending');
  const acceptedConnections = isMentor
    ? connections.asMentor.filter(c => c.status === 'accepted')
    : connections.asStudent.filter(c => c.status === 'accepted');
  const upcomingSessions = [...sessions.asStudent, ...sessions.asMentor]
    .filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const completedSessions = [...sessions.asStudent, ...sessions.asMentor]
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
            Mentoring Dashboard
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            {isMentor ? 'Manage your mentees and sessions' : 'Track your mentorship connections'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {acceptedConnections.length}
                </p>
                <p className="text-sm text-surface-500">Active Connections</p>
              </div>
            </div>
          </div>

          {isMentor && (
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">
                    {pendingMentorConnections.length}
                  </p>
                  <p className="text-sm text-surface-500">Pending Requests</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {upcomingSessions.length}
                </p>
                <p className="text-sm text-surface-500">Upcoming Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {[...sessions.asStudent, ...sessions.asMentor].filter(s => s.status === 'completed').length}
                </p>
                <p className="text-sm text-surface-500">Completed Sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={() => setActiveTab('connections')}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'connections'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Sessions
          </button>
          {isMentor && (
            <button
              onClick={() => setActiveTab('availability')}
              className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
                activeTab === 'availability'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Availability
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            {/* Pending Requests (Mentor Only) */}
            {isMentor && pendingMentorConnections.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                  Pending Requests
                </h2>
                <div className="space-y-4">
                  {pendingMentorConnections.map((conn) => (
                    <div key={conn.id} className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                      <div className="flex items-start gap-4">
                        {conn.student?.profilePicture ? (
                          <Image
                            src={conn.student.profilePicture}
                            alt={conn.student.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg text-primary-600">
                            {conn.student?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-surface-900 dark:text-white">
                            {conn.student?.name}
                          </h3>
                          {conn.student?.discipline && (
                            <p className="text-sm text-surface-500">{conn.student.discipline}</p>
                          )}
                          {conn.message && (
                            <p className="mt-2 text-surface-600 dark:text-surface-400 text-sm bg-surface-50 dark:bg-surface-700 p-3 rounded-lg">
                              &ldquo;{conn.message}&rdquo;
                            </p>
                          )}
                          <p className="text-xs text-surface-500 mt-2">
                            Requested {formatDate(conn.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConnectionResponse(conn.id, 'declined')}
                            disabled={updatingConnection === conn.id}
                            className="p-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleConnectionResponse(conn.id, 'accepted')}
                            disabled={updatingConnection === conn.id}
                            className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                          >
                            {updatingConnection === conn.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Connections */}
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Active Connections
              </h2>
              {acceptedConnections.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                  <Users className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                  <p className="text-surface-600 dark:text-surface-400">No active connections yet</p>
                  {!isMentor && (
                    <Link href="/mentors" className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700">
                      Find a Mentor <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {acceptedConnections.map((conn) => {
                    const person = isMentor ? conn.student : conn.mentor;
                    return (
                      <div key={conn.id} className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center gap-4 mb-4">
                          {person?.profilePicture ? (
                            <Image
                              src={person.profilePicture}
                              alt={person.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg text-primary-600">
                              {person?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-surface-900 dark:text-white">
                              {person?.name}
                            </h3>
                            <p className="text-sm text-surface-500">
                              {isMentor ? (conn.student as Connection['student'])?.discipline : (conn.mentor as Connection['mentor'])?.currentRole}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 px-4 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 flex items-center justify-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </button>
                          <button className="flex-1 py-2 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Schedule
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Upcoming Sessions
              </h2>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                  <Calendar className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                  <p className="text-surface-600 dark:text-surface-400">No upcoming sessions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => {
                    const person = session.mentor || session.student;
                    return (
                      <div key={session.id} className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg text-primary-600">
                              {person?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <h3 className="font-semibold text-surface-900 dark:text-white">
                                {session.topic || 'Mentoring Session'}
                              </h3>
                              <p className="text-sm text-surface-500">
                                with {person?.name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-surface-900 dark:text-white">
                              {formatDate(session.scheduledAt)}
                            </p>
                            <p className="text-sm text-surface-500">
                              {session.durationMinutes} minutes
                            </p>
                          </div>
                        </div>
                        {session.meetingUrl && (
                          <a
                            href={session.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          >
                            <Video className="w-4 h-4" />
                            Join Meeting
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed Sessions */}
            {completedSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                  Completed Sessions
                </h2>
                <div className="space-y-4">
                  {completedSessions.map((session) => {
                    const person = session.mentor || session.student;
                    const isStudentSession = !!session.mentor;
                    const canRate = isStudentSession && !session.rating;

                    return (
                      <div key={session.id} className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-lg text-green-600">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-surface-900 dark:text-white">
                                {session.topic || 'Mentoring Session'}
                              </h3>
                              <p className="text-sm text-surface-500">
                                with {person?.name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-surface-900 dark:text-white">
                              {formatDate(session.scheduledAt)}
                            </p>
                            {session.rating && (
                              <div className="flex items-center gap-1 justify-end mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= session.rating!
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-surface-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rating UI for students */}
                        {canRate && (
                          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                            {ratingSession === session.id ? (
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-surface-600 dark:text-surface-400">Rate this session:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setSelectedRating(star)}
                                      className="p-1"
                                    >
                                      <Star
                                        className={`w-6 h-6 transition-colors ${
                                          star <= selectedRating
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-surface-300 hover:text-yellow-400'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleRateSession(session.id)}
                                  disabled={selectedRating === 0}
                                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 text-white rounded-lg text-sm"
                                >
                                  Submit
                                </button>
                                <button
                                  onClick={() => {
                                    setRatingSession(null);
                                    setSelectedRating(0);
                                  }}
                                  className="text-sm text-surface-500 hover:text-surface-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRatingSession(session.id)}
                                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                              >
                                <Star className="w-4 h-4" />
                                Rate this session
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Availability Tab (Mentor Only) */}
        {activeTab === 'availability' && isMentor && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Your Availability
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Set when students can book sessions with you
                </p>
              </div>
              <button
                onClick={() => setShowAddSlot(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add Time Slot
              </button>
            </div>

            {/* Add Slot Form */}
            {showAddSlot && (
              <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Add Availability Slot</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Day
                    </label>
                    <select
                      value={newSlot.dayOfWeek}
                      onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={day} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddAvailability}
                    disabled={savingSlot}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-400 text-white rounded-lg flex items-center gap-2"
                  >
                    {savingSlot && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Slot
                  </button>
                  <button
                    onClick={() => setShowAddSlot(false)}
                    className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Availability List */}
            {availability.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                <Settings className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                <p className="text-surface-600 dark:text-surface-400">No availability set</p>
                <p className="text-sm text-surface-500 mt-1">Add time slots when you&apos;re available for mentoring</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
                      <th className="px-6 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Day</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Time</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Status</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-surface-600 dark:text-surface-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availability.map((slot) => (
                      <tr key={slot.id} className="border-b border-surface-200 dark:border-surface-700 last:border-0">
                        <td className="px-6 py-4 text-surface-900 dark:text-white font-medium">
                          {DAYS_OF_WEEK[slot.dayOfWeek]}
                        </td>
                        <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            slot.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
                          }`}>
                            {slot.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteAvailability(slot.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CTA for non-mentors */}
        {!isMentor && (
          <div className="mt-12 text-center bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              Want to become a mentor?
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              Share your expertise and help others grow in their careers.
            </p>
            <Link
              href="/mentors/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg"
            >
              <UserPlus className="w-5 h-5" />
              Apply as Mentor
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
