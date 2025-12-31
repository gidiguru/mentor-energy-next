'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Trash2, Edit2, X, Check, User, Reply, ChevronDown, ChevronUp } from 'lucide-react';

interface CommentUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
}

interface Comment {
  id: string;
  pageId: string;
  userId: string;
  content: string;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
}

interface LessonCommentsProps {
  pageId: string;
  currentUserId?: string;
}

export default function LessonComments({ pageId, currentUserId }: LessonCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/comments?pageId=${pageId}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
          // Auto-expand all replies initially
          const parentIds = new Set<string>(data.comments.filter((c: Comment) => c.parentId).map((c: Comment) => c.parentId as string));
          setExpandedReplies(parentIds);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [pageId]);

  // Get parent comments (no parentId)
  const parentComments = comments.filter(c => !c.parentId);

  // Get replies for a comment
  const getReplies = (commentId: string) => {
    return comments.filter(c => c.parentId === commentId);
  };

  // Toggle replies visibility
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          content: newComment,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Start replying to a comment
  const startReply = (comment: Comment, isReply: boolean) => {
    if (replyingToId === comment.id) {
      // Toggle off
      setReplyingToId(null);
      setReplyingToUser(null);
      setReplyContent('');
    } else {
      // If replying to a reply, we'll attach to the original parent
      const targetParentId = isReply ? comment.parentId! : comment.id;
      setReplyingToId(targetParentId);
      // If it's a reply to a reply, prepend @mention
      if (isReply) {
        const userName = getUserName(comment.user);
        setReplyingToUser(userName);
        setReplyContent(`@${userName} `);
      } else {
        setReplyingToUser(null);
        setReplyContent('');
      }
    }
  };

  // Submit reply
  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          content: replyContent,
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setReplyContent('');
        setReplyingToId(null);
        setReplyingToUser(null);
        // Make sure replies are expanded for this comment
        setExpandedReplies(prev => new Set(prev).add(parentId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to post reply');
      }
    } catch (err) {
      setError('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: editContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(comments.map(c =>
          c.id === commentId
            ? { ...c, content: data.comment.content, isEdited: true }
            : c
        ));
        setEditingId(null);
        setEditContent('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update comment');
      }
    } catch (err) {
      setError('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Also remove any replies to this comment
        setComments(comments.filter(c => c.id !== commentId && c.parentId !== commentId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete comment');
      }
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Get user display name
  const getUserName = (user: CommentUser) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'Anonymous User';
  };

  // Render a single comment
  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const replies = getReplies(comment.id);
    const hasReplies = replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'p-4'}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
            {comment.user.profilePicture ? (
              <img
                src={comment.user.profilePicture}
                alt={getUserName(comment.user)}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className={`${isReply ? 'w-4 h-4' : 'w-5 h-5'} text-surface-500`} />
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium text-surface-900 dark:text-white ${isReply ? 'text-sm' : ''}`}>
                {getUserName(comment.user)}
              </span>
              <span className="text-xs text-surface-500">
                {formatDate(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-surface-400">(edited)</span>
              )}
            </div>

            {editingId === comment.id ? (
              // Edit Mode
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    disabled={submitting}
                    className="flex items-center gap-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300 text-sm rounded-lg"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <p className={`mt-1 text-surface-700 dark:text-surface-300 whitespace-pre-wrap break-words ${isReply ? 'text-sm' : ''}`}>
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-2">
                  {/* Reply button - works on both parent comments and replies */}
                  {currentUserId && (
                    <button
                      onClick={() => startReply(comment, isReply)}
                      className="flex items-center gap-1 text-xs text-surface-500 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                  )}

                  {/* Edit/Delete - only for comment owner */}
                  {currentUserId && comment.user.id === currentUserId && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="flex items-center gap-1 text-xs text-surface-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </>
                  )}

                  {/* Show/Hide replies */}
                  {!isReply && hasReplies && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Reply Input */}
                {replyingToId === comment.id && (
                  <div className="mt-3 flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-surface-500" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={replyingToUser ? `Replying to ${replyingToUser}...` : `Reply to ${getUserName(comment.user)}...`}
                        className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleReply(comment.id)}
                          disabled={!replyContent.trim() || submitting}
                          className="flex items-center gap-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 dark:disabled:bg-surface-600 text-white text-sm rounded-lg disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Reply
                        </button>
                        <button
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyingToUser(null);
                            setReplyContent('');
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300 text-sm rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {!isReply && hasReplies && isExpanded && (
                  <div className="border-l-2 border-surface-200 dark:border-surface-600 pl-4 mt-3">
                    {replies.map(reply => renderComment(reply, true))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Count total comments including replies
  const totalComments = comments.length;

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussion ({totalComments})
        </h3>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-surface-500" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts or ask a question..."
              className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-white placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-surface-500">
                {newComment.length}/5000
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 dark:disabled:bg-surface-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-surface-400" />
          </div>
        ) : parentComments.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          parentComments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
