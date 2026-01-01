'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users, Calendar, MessageSquare, Clock, CheckCircle, XCircle,
  Loader2, UserPlus, Video, ArrowRight, Star, Plus, Trash2, Settings, X
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

interface PotentialMentee {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  discipline: string | null;
  qualification: string | null;
  university: string | null;
  bio: string | null;
  matchScore: number;
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
  const [potentialMentees, setPotentialMentees] = useState<PotentialMentee[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'sessions' | 'availability' | 'find-mentees'>('connections');
  const [updatingConnection, setUpdatingConnection] = useState<string | null>(null);
  const [ratingSession, setRatingSession] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  // Availability form state
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
  const [savingSlot, setSavingSlot] = useState(false);

  // Session booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingMentor, setBookingMentor] = useState<{ id: string; name: string } | null>(null);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', duration: 60, topic: '' });
  const [bookingSession, setBookingSession] = useState(false);

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

  const fetchMentees = async () => {
    try {
      const res = await fetch('/api/mentor/find-mentees');
      const data = await res.json();
      setPotentialMentees(data.mentees || []);
    } catch (error) {
      console.error('Error fetching mentees:', error);
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

  const openBookingModal = (mentorId: string, mentorName: string) => {
    setBookingMentor({ id: mentorId, name: mentorName });
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingForm({
      date: tomorrow.toISOString().split('T')[0],
      time: '10:00',
      duration: 60,
      topic: '',
    });
    setShowBookingModal(true);
  };

  const handleBookSession = async () => {
    if (!bookingMentor || !bookingForm.date || !bookingForm.time) return;

    setBookingSession(true);
    try {
      const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`);

      const res = await fetch('/api/mentor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: bookingMentor.id,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: bookingForm.duration,
          topic: bookingForm.topic || null,
        }),
      });

      if (res.ok) {
        await fetchData();
        setShowBookingModal(false);
        setBookingMentor(null);
        setActiveTab('sessions');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to book session');
      }
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session');
    } finally {
      setBookingSession(false);
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

        {/* Tabs - Scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 px-4 mb-6">
          <div className="flex gap-2 sm:gap-4 min-w-max border-b border-surface-200 dark:border-surface-700">
            <button
              onClick={() => setActiveTab('connections')}
              className={`pb-3 px-3 sm:px-1 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'connections'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Connections
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`pb-3 px-3 sm:px-1 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
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
                className={`pb-3 px-3 sm:px-1 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'availability'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                }`}
              >
                Availability
              </button>
            )}
            {isMentor && (
              <button
                onClick={() => {
                  setActiveTab('find-mentees');
                  if (potentialMentees.length === 0) {
                    fetchMentees();
                  }
                }}
                className={`pb-3 px-3 sm:px-1 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'find-mentees'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                }`}
              >
                Find Mentees
              </button>
            )}
          </div>
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
                    <div key={conn.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 sm:p-6 border border-surface-200 dark:border-surface-700">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          {conn.student?.profilePicture ? (
                            <Image
                              src={conn.student.profilePicture}
                              alt={conn.student.name}
                              width={48}
                              height={48}
                              className="rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-base sm:text-lg text-primary-600 flex-shrink-0">
                              {conn.student?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                              {conn.student?.name}
                            </h3>
                            {conn.student?.discipline && (
                              <p className="text-sm text-surface-500 truncate">{conn.student.discipline}</p>
                            )}
                            <p className="text-xs text-surface-500 mt-1">
                              Requested {formatDate(conn.createdAt)}
                            </p>
                          </div>
                        </div>
                        {conn.message && (
                          <p className="text-surface-600 dark:text-surface-400 text-sm bg-surface-50 dark:bg-surface-700 p-3 rounded-lg sm:hidden">
                            &ldquo;{conn.message}&rdquo;
                          </p>
                        )}
                        <div className="flex gap-2 sm:flex-shrink-0">
                          <button
                            onClick={() => handleConnectionResponse(conn.id, 'declined')}
                            disabled={updatingConnection === conn.id}
                            className="flex-1 sm:flex-none p-2 sm:p-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-5 h-5" />
                            <span className="sm:hidden">Decline</span>
                          </button>
                          <button
                            onClick={() => handleConnectionResponse(conn.id, 'accepted')}
                            disabled={updatingConnection === conn.id}
                            className="flex-1 sm:flex-none p-2 sm:p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                          >
                            {updatingConnection === conn.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                            <span className="sm:hidden">Accept</span>
                          </button>
                        </div>
                      </div>
                      {conn.message && (
                        <p className="hidden sm:block mt-3 text-surface-600 dark:text-surface-400 text-sm bg-surface-50 dark:bg-surface-700 p-3 rounded-lg">
                          &ldquo;{conn.message}&rdquo;
                        </p>
                      )}
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
                      <div key={conn.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 sm:p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                          {person?.profilePicture ? (
                            <Image
                              src={person.profilePicture}
                              alt={person.name}
                              width={48}
                              height={48}
                              className="rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-base sm:text-lg text-primary-600 flex-shrink-0">
                              {person?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                              {person?.name}
                            </h3>
                            <p className="text-sm text-surface-500 truncate">
                              {isMentor ? (conn.student as Connection['student'])?.discipline : (conn.mentor as Connection['mentor'])?.currentRole}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/chat/${conn.id}`}
                            className="flex-1 py-2 px-2 sm:px-4 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 flex items-center justify-center gap-1 sm:gap-2 text-sm"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden xs:inline">Message</span>
                          </Link>
                          {!isMentor && conn.mentor && (
                            <button
                              onClick={() => openBookingModal(conn.mentor!.id, conn.mentor!.name)}
                              className="flex-1 py-2 px-2 sm:px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-1 sm:gap-2 text-sm"
                            >
                              <Calendar className="w-4 h-4" />
                              <span className="hidden xs:inline">Schedule</span>
                            </button>
                          )}
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
                      <div key={session.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 sm:p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-base sm:text-lg text-primary-600 flex-shrink-0">
                              {person?.name?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                                {session.topic || 'Mentoring Session'}
                              </h3>
                              <p className="text-sm text-surface-500 truncate">
                                with {person?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4 pl-13 sm:pl-0">
                            <div>
                              <p className="font-medium text-surface-900 dark:text-white text-sm sm:text-base">
                                {formatDate(session.scheduledAt)}
                              </p>
                              <p className="text-xs sm:text-sm text-surface-500">
                                {session.durationMinutes} min
                              </p>
                            </div>
                            {session.meetingUrl && (
                              <Link
                                href={`/session/${session.id}`}
                                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm whitespace-nowrap"
                              >
                                <Video className="w-4 h-4" />
                                <span className="hidden sm:inline">Join Session</span>
                                <span className="sm:hidden">Join</span>
                              </Link>
                            )}
                          </div>
                        </div>
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
                      <div key={session.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 sm:p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-base sm:text-lg text-green-600 flex-shrink-0">
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                                {session.topic || 'Mentoring Session'}
                              </h3>
                              <p className="text-sm text-surface-500 truncate">
                                with {person?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
                            <div className="sm:text-right">
                              <p className="font-medium text-surface-900 dark:text-white text-sm sm:text-base">
                                {formatDate(session.scheduledAt)}
                              </p>
                            </div>
                            {session.rating && (
                              <div className="flex items-center gap-0.5">
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
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <span className="text-sm text-surface-600 dark:text-surface-400">Rate this session:</span>
                                <div className="flex items-center gap-4">
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => setSelectedRating(star)}
                                        className="p-1"
                                      >
                                        <Star
                                          className={`w-6 h-6 sm:w-6 sm:h-6 transition-colors ${
                                            star <= selectedRating
                                              ? 'text-yellow-500 fill-yellow-500'
                                              : 'text-surface-300 hover:text-yellow-400'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRateSession(session.id)}
                                      disabled={selectedRating === 0}
                                      className="px-3 sm:px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 text-white rounded-lg text-sm"
                                    >
                                      Submit
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRatingSession(null);
                                        setSelectedRating(0);
                                      }}
                                      className="text-sm text-surface-500 hover:text-surface-700 px-2"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Your Availability
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Set when mentees can book sessions with you
                </p>
              </div>
              <button
                onClick={() => setShowAddSlot(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Time Slot
              </button>
            </div>

            {/* Add Slot Form */}
            {showAddSlot && (
              <div className="bg-white dark:bg-surface-800 rounded-xl p-4 sm:p-6 border border-surface-200 dark:border-surface-700">
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
                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                  <button
                    onClick={() => setShowAddSlot(false)}
                    className="px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAvailability}
                    disabled={savingSlot}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-400 text-white rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {savingSlot && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Slot
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
              <>
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {availability.map((slot) => (
                    <div key={slot.id} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-surface-900 dark:text-white">
                            {DAYS_OF_WEEK[slot.dayOfWeek]}
                          </p>
                          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                            slot.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
                          }`}>
                            {slot.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteAvailability(slot.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
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
              </>
            )}
          </div>
        )}

        {/* Find Mentees Tab (Mentor Only) */}
        {activeTab === 'find-mentees' && isMentor && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Find Mentees
              </h2>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">
                Discover mentees whose interests match your expertise
              </p>
            </div>

            {potentialMentees.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                <Users className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                <p className="text-surface-600 dark:text-surface-400">No potential mentees found</p>
                <p className="text-sm text-surface-500 mt-1">Check back later as more mentees join</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {potentialMentees.map((mentee) => (
                  <div key={mentee.id} className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-start gap-4 mb-4">
                      {mentee.profilePicture ? (
                        <Image
                          src={mentee.profilePicture}
                          alt={mentee.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg text-primary-600">
                          {mentee.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-surface-900 dark:text-white truncate">
                          {mentee.name}
                        </h3>
                        {mentee.discipline && (
                          <p className="text-sm text-primary-600 dark:text-primary-400">{mentee.discipline}</p>
                        )}
                        {mentee.university && (
                          <p className="text-xs text-surface-500 truncate">{mentee.university}</p>
                        )}
                      </div>
                      {mentee.matchScore > 0 && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          Match
                        </span>
                      )}
                    </div>
                    {mentee.bio && (
                      <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-4">
                        {mentee.bio}
                      </p>
                    )}
                    {mentee.qualification && (
                      <p className="text-xs text-surface-500 mb-4">
                        {mentee.qualification}
                      </p>
                    )}
                    <button
                      className="w-full py-2 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Reach Out
                    </button>
                  </div>
                ))}
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

      {/* Session Booking Modal */}
      {showBookingModal && bookingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBookingModal(false)}
          />
          <div className="relative bg-white dark:bg-surface-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              Book a Session
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Schedule a mentoring session with {bookingMentor.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Duration
                </label>
                <select
                  value={bookingForm.duration}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={bookingForm.topic}
                  onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
                  placeholder="What would you like to discuss?"
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBookSession}
                disabled={bookingSession || !bookingForm.date || !bookingForm.time}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-400 text-white rounded-lg flex items-center justify-center gap-2"
              >
                {bookingSession && <Loader2 className="w-4 h-4 animate-spin" />}
                Book Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
