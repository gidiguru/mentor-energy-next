'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Menu, X, BookOpen, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import LessonComments from '@/components/LessonComments';
import LessonRating from '@/components/LessonRating';
import LessonTools from '@/components/LessonTools';

interface Media {
  id: string;
  type: string;
  url: string;
  title: string | null;
}

interface Page {
  id: string;
  title: string;
  content: string | null;
  pageType: string;
  sequence: number;
  estimatedDuration: string | null;
  quizQuestions: unknown;
  media: Media[];
}

interface Section {
  id: string;
  title: string;
  sequence: number;
  pages: Page[];
}

interface Module {
  id: string;
  moduleId: string;
  title: string;
  sections: Section[];
}

interface LessonData {
  module: Module;
  section: Section;
  page: Page;
  navigation: {
    prev: { sectionId: string; pageId: string; title: string } | null;
    next: { sectionId: string; pageId: string; title: string } | null;
  };
}

interface ProgressData {
  completedPages: Record<string, boolean>;
  totalPages: number;
  completedCount: number;
  progressPercentage: number;
  userId?: string;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const moduleId = params.moduleId as string;
  const sectionId = params.sectionId as string;
  const pageId = params.pageId as string;

  // Fetch lesson data
  useEffect(() => {
    async function fetchLesson() {
      try {
        const response = await fetch(`/api/learn/${moduleId}/${sectionId}/${pageId}`);
        if (response.ok) {
          const lessonData = await response.json();
          setData(lessonData);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [moduleId, sectionId, pageId]);

  // Fetch progress data
  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch(`/api/progress?moduleId=${moduleId}`);
        if (response.ok) {
          const progressData = await response.json();
          setProgress(progressData);
          // Check if current page is already completed
          if (progressData.completedPages && data?.page?.id) {
            setCompleted(!!progressData.completedPages[data.page.id]);
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    }

    if (moduleId) {
      fetchProgress();
    }
  }, [moduleId, data?.page?.id]);

  // Update completed state when page changes
  useEffect(() => {
    if (progress?.completedPages && data?.page?.id) {
      setCompleted(!!progress.completedPages[data.page.id]);
    }
  }, [progress, data?.page?.id]);

  const toggleComplete = async (markAsComplete: boolean = !completed) => {
    if (!data?.page?.id || saving) return;

    setSaving(true);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: data.page.id,
          moduleId: moduleId,
          completed: markAsComplete,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCompleted(markAsComplete);
        // Update local progress state
        setProgress(prev => prev ? {
          ...prev,
          completedPages: { ...prev.completedPages, [data.page.id]: markAsComplete },
          completedCount: result.completedCount,
          progressPercentage: result.progressPercentage,
        } : null);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-complete when video ends (only if not already completed)
  const handleVideoEnded = () => {
    if (!completed && !saving) {
      toggleComplete(true);
    }
  };

  const goToNext = () => {
    if (data?.navigation.next) {
      router.push(`/learn/${moduleId}/${data.navigation.next.sectionId}/${data.navigation.next.pageId}`);
    }
  };

  const goToPrev = () => {
    if (data?.navigation.prev) {
      router.push(`/learn/${moduleId}/${data.navigation.prev.sectionId}/${data.navigation.prev.pageId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading lesson...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">Lesson not found</h1>
          <Link href="/learn" className="text-primary-600 hover:text-primary-700">
            Back to Learning Center
          </Link>
        </div>
      </div>
    );
  }

  const { module, section, page, navigation } = data;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex">
      {/* Sidebar - Course Outline */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <Link
                href={`/learn/${moduleId}`}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Course Overview
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-surface-500 hover:text-surface-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="font-semibold text-surface-900 dark:text-white mt-2 line-clamp-2">
              {module.title}
            </h2>
            {/* Progress Bar */}
            {progress && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-surface-500 mb-1">
                  <span>{progress.completedCount} of {progress.totalPages} complete</span>
                  <span>{progress.progressPercentage}%</span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Course Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {module.sections.map((s) => (
              <div key={s.id} className="mb-4">
                <h3 className={`text-sm font-medium mb-2 ${s.id === sectionId ? 'text-primary-600' : 'text-surface-600 dark:text-surface-400'}`}>
                  {s.title}
                </h3>
                <ul className="space-y-1">
                  {s.pages.map((p) => {
                    const isActive = p.id === pageId;
                    const isPageCompleted = progress?.completedPages?.[p.id];
                    const Icon = p.pageType === 'quiz' ? HelpCircle : BookOpen;

                    return (
                      <li key={p.id}>
                        <Link
                          href={`/learn/${moduleId}/${s.id}/${p.id}`}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                          }`}
                        >
                          {isPageCompleted ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-500" />
                          ) : (
                            <Icon className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span className="line-clamp-1">{p.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-surface-500 hover:text-surface-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 text-center lg:text-left lg:ml-4">
              <h1 className="font-semibold text-surface-900 dark:text-white line-clamp-1">
                {page.title}
              </h1>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {section.title}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {page.estimatedDuration && (
                <span className="hidden sm:flex text-sm text-surface-500 dark:text-surface-400 items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {page.estimatedDuration}
                </span>
              )}
              <LessonTools pageId={page.id} currentUserId={progress?.userId} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {page.pageType === 'quiz' ? (
              <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                    {page.title}
                  </h2>
                  <p className="text-surface-600 dark:text-surface-400 mb-6">
                    Test your knowledge with this quiz.
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    Quiz functionality coming soon!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Video Content */}
                {page.media && page.media.length > 0 && (
                  <div className="space-y-4">
                    {page.media.filter(m => m.type === 'video').map((video) => (
                      <VideoPlayer key={video.id} video={video} onEnded={handleVideoEnded} />
                    ))}
                  </div>
                )}

                {/* Description Card */}
                {page.content && (
                  <div className="card preset-filled-surface-100-900 p-6">
                    <h3 className="h4 mb-4">About this lesson</h3>
                    <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(page.content) }} />
                    </article>
                  </div>
                )}

                {/* Empty state */}
                {!page.content && !page.media?.length && (
                  <div className="card preset-filled-surface-100-900 p-6 text-center">
                    <p className="text-surface-500">No content available for this lesson.</p>
                  </div>
                )}
              </div>
            )}

            {/* Rating Section */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
                Rate this lesson
              </h3>
              <LessonRating pageId={page.id} currentUserId={progress?.userId} />
            </div>

            {/* Comments Section */}
            <div className="mt-8">
              <LessonComments pageId={page.id} currentUserId={progress?.userId} />
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <footer className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={goToPrev}
              disabled={!navigation.prev}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                navigation.prev
                  ? 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                  : 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              onClick={() => toggleComplete()}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                completed
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                  : saving
                  ? 'bg-surface-200 text-surface-500 dark:bg-surface-600 dark:text-surface-400 cursor-wait'
                  : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className={`w-4 h-4 ${completed ? 'fill-current' : ''}`} />
              )}
              {saving ? 'Saving...' : completed ? 'Completed ✓' : 'Mark Complete'}
            </button>

            <button
              onClick={goToNext}
              disabled={!navigation.next}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                navigation.next
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-surface-300 dark:bg-surface-600 text-surface-500 cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Helper to detect and parse video URLs
function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } {
  // YouTube patterns - handle various formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtube.com/watch?v=VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/v/VIDEO_ID
  // https://youtube.com/shorts/VIDEO_ID
  const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}` };
  }

  // Vimeo patterns - handle various formats:
  // https://vimeo.com/VIDEO_ID
  // https://www.vimeo.com/VIDEO_ID
  // https://player.vimeo.com/video/VIDEO_ID
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Direct video URL
  return { type: 'direct', embedUrl: url };
}

// Video player component with error handling
function VideoPlayer({ video, onEnded }: { video: Media; onEnded?: () => void }) {
  const [error, setError] = useState(false);

  const { type, embedUrl } = parseVideoUrl(video.url);

  // YouTube or Vimeo embed - auto-complete not supported for embeds
  if (type === 'youtube' || type === 'vimeo') {
    return (
      <div className="bg-black rounded-xl overflow-hidden">
        <div className="relative w-full aspect-video">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title || 'Video'}
          />
        </div>
        {video.title && (
          <div className="p-4 bg-surface-800 border-t border-surface-700">
            <p className="text-base font-medium text-white">{video.title}</p>
          </div>
        )}
      </div>
    );
  }

  // Direct video file - show error state if failed
  if (error) {
    return (
      <div className="bg-surface-800 rounded-xl overflow-hidden">
        <div className="w-full aspect-video flex flex-col items-center justify-center bg-surface-900 text-surface-400">
          <AlertCircle className="w-12 h-12 mb-3" />
          <p className="text-sm">Video failed to load</p>
          <p className="text-xs mt-1 text-surface-500 max-w-md text-center px-4">
            This video format may not be supported on your device. Try viewing on desktop or use a different video format (H.264/MP4).
          </p>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs text-primary-400 underline"
          >
            Open video directly
          </a>
        </div>
        {video.title && (
          <div className="p-4 bg-surface-800 border-t border-surface-700">
            <p className="text-base font-medium text-white">{video.title}</p>
          </div>
        )}
      </div>
    );
  }

  // Direct video - show video element immediately (browser handles loading)
  return (
    <div className="bg-black rounded-xl overflow-hidden">
      <video
        key={embedUrl}
        src={embedUrl}
        controls
        playsInline
        preload="metadata"
        className="w-full aspect-video"
        controlsList="nodownload"
        onError={() => setError(true)}
        onEnded={onEnded}
      >
        Your browser does not support the video tag.
      </video>
      {video.title && (
        <div className="p-4 bg-surface-800 border-t border-surface-700">
          <p className="text-base font-medium text-white">{video.title}</p>
        </div>
      )}
    </div>
  );
}

// Simple markdown to HTML converter
function formatMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary-500 pl-4 italic text-surface-600 dark:text-surface-400 my-4">$1</blockquote>')
    // Unordered lists
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    // Paragraphs
    .replace(/\n\n/gim, '</p><p class="my-4">')
    // Line breaks
    .replace(/\n/gim, '<br />');
}
