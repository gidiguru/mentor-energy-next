'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface LessonRatingProps {
  pageId: string;
  currentUserId?: string;
}

export default function LessonRating({ pageId, currentUserId }: LessonRatingProps) {
  const [average, setAverage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch current rating data
  useEffect(() => {
    async function fetchRating() {
      try {
        const response = await fetch(`/api/ratings?pageId=${pageId}`);
        if (response.ok) {
          const data = await response.json();
          setAverage(data.average);
          setCount(data.count);
          setUserRating(data.userRating);
        }
      } catch (err) {
        console.error('Error fetching rating:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRating();
  }, [pageId]);

  // Submit rating
  const handleRate = async (rating: number) => {
    if (!currentUserId || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, rating }),
      });

      if (response.ok) {
        const data = await response.json();
        setAverage(data.average);
        setCount(data.count);
        setUserRating(data.userRating);
      }
    } catch (err) {
      console.error('Error saving rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Render a star
  const renderStar = (position: number, interactive: boolean = false) => {
    const displayRating = interactive
      ? (hoverRating ?? userRating ?? 0)
      : average;

    const filled = position <= displayRating;
    const halfFilled = !filled && position - 0.5 <= displayRating;

    return (
      <button
        key={position}
        type="button"
        disabled={!currentUserId || submitting}
        onClick={() => interactive && handleRate(position)}
        onMouseEnter={() => interactive && currentUserId && setHoverRating(position)}
        onMouseLeave={() => interactive && setHoverRating(null)}
        className={`${interactive && currentUserId ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform disabled:cursor-not-allowed`}
      >
        <Star
          className={`w-5 h-5 ${
            filled
              ? 'fill-yellow-400 text-yellow-400'
              : halfFilled
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'fill-transparent text-surface-300 dark:text-surface-600'
          } transition-colors`}
        />
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-5 h-5 bg-surface-200 dark:bg-surface-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700">
      {/* Rating display */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((position) => renderStar(position, true))}
        </div>

        <div className="text-sm text-surface-600 dark:text-surface-400">
          {count > 0 ? (
            <>
              <span className="font-medium text-surface-900 dark:text-white">{average.toFixed(1)}</span>
              <span className="mx-1">·</span>
              <span>{count} {count === 1 ? 'rating' : 'ratings'}</span>
            </>
          ) : (
            <span>No ratings yet</span>
          )}
        </div>
      </div>

      {/* User's rating status */}
      {currentUserId && (
        <div className="text-xs text-surface-500 dark:text-surface-400">
          {userRating ? (
            <span>You rated this {userRating} {userRating === 1 ? 'star' : 'stars'}</span>
          ) : (
            <span>Click to rate this lesson</span>
          )}
        </div>
      )}

      {!currentUserId && (
        <div className="text-xs text-surface-500 dark:text-surface-400">
          Sign in to rate this lesson
        </div>
      )}
    </div>
  );
}
