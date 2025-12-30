'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Video, FileText, HelpCircle } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

export default function NewPageEditor() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;
  const sectionId = params.sectionId as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    pageType: 'lesson',
    estimatedDuration: '',
    videoUrl: '',
  });

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
      const response = await fetch(`/api/admin/modules/${moduleId}/sections/${sectionId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create page');
      }

      router.push(`/admin/modules/${moduleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  const pageTypeOptions = [
    { value: 'lesson', label: 'Lesson', icon: FileText, desc: 'Text and video content' },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle, desc: 'Knowledge check' },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href={`/admin/modules/${moduleId}`}
          className="inline-flex items-center text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Module
        </Link>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
          Add New Lesson
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Page Type */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">
            Content Type
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pageTypeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
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
                <option.icon className={`w-6 h-6 ${
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
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-6">
            Lesson Details
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Introduction to Drilling Fluids"
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
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 15 min"
              />
            </div>
          </div>
        </div>

        {/* Video Upload */}
        {formData.pageType === 'lesson' && (
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-6 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Content
            </h2>

            <FileUpload
              label="Upload Video"
              hint="Drag and drop or click to upload (MP4, WebM, MOV - max 500MB)"
              accept="video/*"
              maxSize={500 * 1024 * 1024}
              currentUrl={formData.videoUrl}
              onUpload={handleVideoUpload}
            />

            <p className="mt-4 text-sm text-surface-500">
              Or paste a YouTube/Vimeo URL in the content below
            </p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">
            {formData.pageType === 'quiz' ? 'Quiz Instructions' : 'Lesson Content'}
          </h2>
          <p className="text-sm text-surface-500 mb-4">
            Use Markdown for formatting. Supports headers, bold, lists, etc.
          </p>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={12}
            className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder={formData.pageType === 'quiz'
              ? "# Quiz Title\n\nInstructions for the quiz..."
              : "# Lesson Title\n\n## Introduction\n\nYour lesson content here...\n\n## Key Concepts\n\n- Point 1\n- Point 2"
            }
          />
        </div>

        {/* Submit */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/admin/modules/${moduleId}`}
            className="px-6 py-2 rounded-lg border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Lesson
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
