'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Menu, X, BookOpen, HelpCircle } from 'lucide-react';

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

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  const moduleId = params.moduleId as string;
  const sectionId = params.sectionId as string;
  const pageId = params.pageId as string;

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

  const markComplete = () => {
    setCompleted(true);
    // TODO: Save progress to database
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
                          <Icon className="w-4 h-4 flex-shrink-0" />
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
                <span className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {page.estimatedDuration}
                </span>
              )}
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
              <div className="space-y-8">
                {/* Video Content */}
                {page.media && page.media.length > 0 && (
                  <div className="space-y-4">
                    {page.media.filter(m => m.type === 'video').map((video) => (
                      <div key={video.id} className="bg-black rounded-xl overflow-hidden">
                        <video
                          src={video.url}
                          controls
                          playsInline
                          className="w-full aspect-video"
                          controlsList="nodownload"
                        >
                          Your browser does not support the video tag.
                        </video>
                        {video.title && (
                          <p className="p-3 text-sm text-surface-400 bg-surface-900">
                            {video.title}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Content */}
                <article className="prose prose-lg dark:prose-invert max-w-none">
                  {page.content ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(page.content) }} />
                  ) : !page.media?.length ? (
                    <p className="text-surface-500">No content available for this lesson.</p>
                  ) : null}
                </article>
              </div>
            )}
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
              onClick={markComplete}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                completed
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${completed ? 'fill-current' : ''}`} />
              {completed ? 'Completed' : 'Mark Complete'}
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
