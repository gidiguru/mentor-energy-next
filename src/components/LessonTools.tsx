'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, StickyNote, X, Save, Loader2 } from 'lucide-react';

interface LessonToolsProps {
  pageId: string;
  currentUserId?: string;
}

export default function LessonTools({ pageId, currentUserId }: LessonToolsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Fetch bookmark and note status
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [bookmarkRes, noteRes] = await Promise.all([
          fetch(`/api/bookmarks?pageId=${pageId}`),
          fetch(`/api/notes?pageId=${pageId}`),
        ]);

        if (bookmarkRes.ok) {
          const data = await bookmarkRes.json();
          setIsBookmarked(data.isBookmarked);
        }

        if (noteRes.ok) {
          const data = await noteRes.json();
          if (data.note) {
            setNote(data.note.content);
            setSavedNote(data.note.content);
          }
        }
      } catch (err) {
        console.error('Error fetching lesson tools data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [pageId, currentUserId]);

  // Toggle bookmark
  const toggleBookmark = async () => {
    if (!currentUserId || bookmarkLoading) return;

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await fetch(`/api/bookmarks?pageId=${pageId}`, { method: 'DELETE' });
        setIsBookmarked(false);
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId }),
        });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Save note
  const saveNote = async () => {
    if (!currentUserId || saving) return;

    setSaving(true);
    try {
      if (note.trim()) {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId, content: note }),
        });
        setSavedNote(note);
      } else if (savedNote) {
        // Delete note if empty
        await fetch(`/api/notes?pageId=${pageId}`, { method: 'DELETE' });
        setSavedNote('');
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUserId) return null;

  const hasUnsavedChanges = note !== savedNote;

  return (
    <div className="flex items-center gap-2">
      {/* Bookmark Button */}
      <button
        onClick={toggleBookmark}
        disabled={bookmarkLoading || loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isBookmarked
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
        }`}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
      >
        {bookmarkLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isBookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
      </button>

      {/* Notes Button */}
      <button
        onClick={() => setShowNotes(!showNotes)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          showNotes || savedNote
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
        }`}
        title="Add notes"
      >
        <StickyNote className="w-4 h-4" />
        <span className="hidden sm:inline">Notes</span>
        {savedNote && !showNotes && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
      </button>

      {/* Notes Panel */}
      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowNotes(false)}>
          <div
            className="w-full max-w-lg bg-white dark:bg-surface-800 rounded-xl shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                My Notes
              </h3>
              <button
                onClick={() => setShowNotes(false)}
                className="p-1 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add your personal notes for this lesson..."
                className="w-full h-48 px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-surface-500">
                  {note.length} characters
                  {hasUnsavedChanges && <span className="ml-2 text-yellow-600">• Unsaved changes</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNotes(false)}
                    className="px-4 py-2 text-sm text-surface-600 dark:text-surface-300 hover:text-surface-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    disabled={saving || !hasUnsavedChanges}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 dark:disabled:bg-surface-600 text-white text-sm font-medium rounded-lg disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
