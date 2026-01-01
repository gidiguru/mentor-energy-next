'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Video, VideoOff, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import type { DailyCall } from '@daily-co/daily-js';

interface SessionInfo {
  meetingUrl: string | null;
  token?: string;
  roomName?: string;
  userName: string;
  isMentor: boolean;
  session: {
    id: string;
    topic: string | null;
    scheduledAt: string;
    durationMinutes: number;
  };
}

export default function SessionVideoPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [participants, setParticipants] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch session info
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/auth');
      return;
    }

    async function fetchSessionInfo() {
      try {
        const res = await fetch(`/api/mentor/sessions/${sessionId}/join`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load session');
          return;
        }

        setSessionInfo(data);
      } catch (err) {
        setError('Failed to connect to session');
      } finally {
        setLoading(false);
      }
    }

    fetchSessionInfo();
  }, [sessionId, isSignedIn, isLoaded, router]);

  // Initialize Daily.co call
  const joinCall = useCallback(async () => {
    if (!sessionInfo?.meetingUrl || !containerRef.current) return;

    try {
      // Dynamically import Daily.co
      const Daily = (await import('@daily-co/daily-js')).default;

      const frame = Daily.createFrame(containerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
        },
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      // Set up event handlers
      frame.on('joined-meeting', () => {
        setIsInCall(true);
      });

      frame.on('left-meeting', () => {
        setIsInCall(false);
        router.push('/dashboard/mentoring');
      });

      frame.on('participant-joined', () => {
        setParticipants(Object.keys(frame.participants()).length);
      });

      frame.on('participant-left', () => {
        setParticipants(Object.keys(frame.participants()).length);
      });

      frame.on('error', (e) => {
        console.error('Daily error:', e);
        setError('Video call error. Please try again.');
      });

      // Join the call
      const joinOptions: { url: string; userName: string; token?: string } = {
        url: sessionInfo.meetingUrl,
        userName: sessionInfo.userName,
      };

      if (sessionInfo.token) {
        joinOptions.token = sessionInfo.token;
      }

      await frame.join(joinOptions);
      setCallFrame(frame);
    } catch (err) {
      console.error('Failed to join call:', err);
      setError('Failed to start video call. Please try again.');
    }
  }, [sessionInfo, router]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [callFrame]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-surface-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
        <div className="bg-surface-800 rounded-xl p-8 max-w-md text-center">
          <VideoOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Unable to Join</h1>
          <p className="text-surface-400 mb-6">{error}</p>
          <Link
            href="/dashboard/mentoring"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!sessionInfo?.meetingUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
        <div className="bg-surface-800 rounded-xl p-8 max-w-md text-center">
          <Video className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Video Room Not Ready</h1>
          <p className="text-surface-400 mb-6">
            The video room for this session hasn&apos;t been set up yet. Please try again later or contact support.
          </p>
          <Link
            href="/dashboard/mentoring"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Header */}
      <div className="bg-surface-800 border-b border-surface-700 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/mentoring"
              className="text-surface-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-white font-semibold">
                {sessionInfo.session.topic || 'Mentoring Session'}
              </h1>
              <div className="flex items-center gap-3 text-sm text-surface-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(sessionInfo.session.scheduledAt)}
                </span>
                <span>•</span>
                <span>{sessionInfo.session.durationMinutes} min</span>
                {isInCall && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {participants} in call
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              sessionInfo.isMentor
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {sessionInfo.isMentor ? 'Mentor' : 'Mentee'}
            </span>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 p-4">
        {!isInCall && (
          <div className="h-full flex items-center justify-center">
            <div className="bg-surface-800 rounded-xl p-8 max-w-md text-center">
              <Video className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Ready to Join?</h2>
              <p className="text-surface-400 mb-6">
                Click the button below to join the video call with your {sessionInfo.isMentor ? 'mentee' : 'mentor'}.
              </p>
              <button
                onClick={joinCall}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Join Video Call
              </button>
              <p className="text-xs text-surface-500 mt-4">
                Make sure your camera and microphone are enabled
              </p>
            </div>
          </div>
        )}

        {/* Daily.co video container - always rendered to maintain ref */}
        <div
          ref={containerRef}
          className={`h-full w-full rounded-xl overflow-hidden bg-black ${!isInCall ? 'hidden' : ''}`}
          style={{ minHeight: 'calc(100vh - 140px)' }}
        />
      </div>
    </div>
  );
}
