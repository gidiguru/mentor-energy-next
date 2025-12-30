'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Video, FileText, HelpCircle } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

export default function EditPageEditor() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;
  const sectionId = params.sectionId as string;
  const pageId = params.pageId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    pageType: 'lesson',
    estimatedDuration: '',
    videoUrl: '',
  });

  useEffect(() => {
    async function fetchPage() {
      try {
        const response = await fetch(`/api/admin/modules/${moduleId}/sections/${sectionId}/pages/${pageId}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            title: data.page.title || '',
            content: data.page.content || '',
            pageType: data.page.pageType || 'lesson',
            estimatedDuration: data.page.estimatedDuration || '',
            videoUrl: data.page.videoUrl || '',
          });
        } else {
          setError('Failed to load lesson');
        }
      } catch (err) {
        setError('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [moduleId, sectionId, pageId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoUpload = (file: { url: string }) => {
    setFormData(prev => ({ ...prev, videoUrl: file.url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/sections/${sectionId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update lesson');
      }

      router.push(`/admin/modules/${moduleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson');
    } finally {
      setSaving(false);
    }
  };

  const pageTypeOptions = [
    { value: 'lesson', label: 'Lesson', icon: FileText, desc: 'Text and video content' },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle, desc: 'Knowledge check' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <Link
          href={`/admin/modules/${moduleId}`}
          className="inline-flex items-center text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Module
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
          Edit Lesson
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Page Type */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-4">
            Content Type
          </h2>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
            {pageTypeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-colors active:scale-[0.98] ${
                  formData.pageType === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-600 hover:border-surface-300'
                }`}
              >
                <input
                  type="radio"
                  name="pageType"
                  value={option.value}
                  checked={formData.pageType === option.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <option.icon className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 ${
                  formData.pageType === option.value ? 'text-primary-600' : 'text-surface-400'
                }`} />
                <div>
                  <p className="font-medium text-surface-900 dark:text-white">{option.label}</p>
                  <p className="text-sm text-surface-500">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-4 md:mb-6">
            Lesson Details
          </h2>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="e.g., Introduction to Drilling Fluids"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Estimated Duration
              </label>
              <input
                type="text"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="e.g., 15 min"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Video Upload */}
        {formData.pageType === 'lesson' && (
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700">
            <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Content
            </h2>

            <FileUpload
              label="Upload Video"
              hint="Tap to upload video (MP4, MOV - max 500MB)"
              accept="video/*"
              maxSize={500 * 1024 * 1024}
              currentUrl={formData.videoUrl}
              onUpload={handleVideoUpload}
            />

            {formData.videoUrl && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove video
                </button>
              </div>
            )}

            <p className="mt-4 text-sm text-surface-500">
              Or paste a YouTube/Vimeo URL in the content below
            </p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-2 md:mb-4">
            {formData.pageType === 'quiz' ? 'Quiz Instructions' : 'Lesson Content'}
          </h2>
          <p className="text-sm text-surface-500 mb-4">
            Use Markdown for formatting.
          </p>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={8}
            className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder={formData.pageType === 'quiz'
              ? "# Quiz Title\n\nInstructions for the quiz..."
              : "# Lesson Title\n\n## Introduction\n\nYour lesson content here..."
            }
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Submit */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 md:gap-4 pb-6">
          <Link
            href={`/admin/modules/${moduleId}`}
            className="px-6 py-3 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-center font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 active:scale-[0.98] text-white font-semibold transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
