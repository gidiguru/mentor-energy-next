'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  isOwnMessage: boolean;
}

interface OtherParticipant {
  id: string;
  name: string;
  profilePicture: string | null;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const connectionId = params.connectionId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherParticipant, setOtherParticipant] = useState<OtherParticipant | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/mentor/messages?connectionId=${connectionId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load messages');
        return;
      }

      setMessages(data.messages);
      setOtherParticipant(data.otherParticipant);
      setCurrentUserId(data.currentUserId);
      setError(null);
    } catch (err) {
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  // Initial fetch
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/auth');
      return;
    }

    fetchMessages();
  }, [isSignedIn, isLoaded, router, fetchMessages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!isSignedIn || loading) return;

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [isSignedIn, loading, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch('/api/mentor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          content: messageContent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, data.message]);
      } else {
        setNewMessage(messageContent); // Restore message if failed
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      setNewMessage(messageContent);
      alert('Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-8 max-w-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            href="/dashboard/mentoring"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-4">
          <Link
            href="/dashboard/mentoring"
            className="p-2 -ml-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {otherParticipant && (
            <div className="flex items-center gap-3">
              {otherParticipant.profilePicture ? (
                <Image
                  src={otherParticipant.profilePicture}
                  alt={otherParticipant.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                  {otherParticipant.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-semibold text-surface-900 dark:text-white">
                  {otherParticipant.name}
                </h1>
                <p className="text-xs text-surface-500">Mentorship Chat</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-2xl space-y-4">
          {/* Debug info - remove after fixing */}
          <div className="text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded text-yellow-800 dark:text-yellow-200">
            <p>Your ID: {currentUserId || 'not loaded'}</p>
            {messages[0] && <p>First msg sender: {messages[0].sender.id}</p>}
            {messages[0] && <p>Match: {String(messages[0]?.sender?.id === currentUserId)}</p>}
          </div>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-surface-500 dark:text-surface-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = currentUserId && message.sender.id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] ${
                      isOwn
                        ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-white dark:bg-surface-800 text-surface-900 dark:text-white rounded-2xl rounded-bl-md border border-surface-200 dark:border-surface-700'
                    } px-4 py-2`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                        {message.sender.name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn
                          ? 'text-primary-200'
                          : 'text-surface-400'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 px-4 py-3 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="container mx-auto max-w-2xl">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-full border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 dark:disabled:bg-surface-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
