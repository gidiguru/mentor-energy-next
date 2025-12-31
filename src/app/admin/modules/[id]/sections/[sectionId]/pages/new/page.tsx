'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Video, FileText, HelpCircle, FlaskConical, Target, ListChecks, Plus, Trash2 } from 'lucide-react';
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

  // Lab configuration
  const [labConfig, setLabConfig] = useState({
    labType: 'guided' as 'simulation' | 'interactive' | 'sandbox' | 'guided',
    labUrl: '',
    instructions: [''],
    objectives: [''],
    tools: [''],
    timeLimit: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoUpload = (file: { url: string }) => {
    setFormData(prev => ({ ...prev, videoUrl: file.url }));
  };

  // Lab config helpers
  const addLabItem = (field: 'instructions' | 'objectives' | 'tools') => {
    setLabConfig(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeLabItem = (field: 'instructions' | 'objectives' | 'tools', index: number) => {
    setLabConfig(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateLabItem = (field: 'instructions' | 'objectives' | 'tools', index: number, value: string) => {
    setLabConfig(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Prepare lab config for submission (filter out empty strings)
      const cleanedLabConfig = formData.pageType === 'lab' ? {
        labType: labConfig.labType,
        labUrl: labConfig.labUrl || undefined,
        instructions: labConfig.instructions.filter(i => i.trim()),
        objectives: labConfig.objectives.filter(o => o.trim()),
        tools: labConfig.tools.filter(t => t.trim()),
        timeLimit: labConfig.timeLimit || undefined,
      } : undefined;

      const response = await fetch(`/api/admin/modules/${moduleId}/sections/${sectionId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          labConfig: cleanedLabConfig,
        }),
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
    { value: 'lab', label: 'Virtual Lab', icon: FlaskConical, desc: 'Hands-on practice' },
  ];

  const labTypeOptions = [
    { value: 'guided', label: 'Guided Lab', desc: 'Step-by-step instructions with checkpoints' },
    { value: 'simulation', label: 'Simulation', desc: 'Interactive scenario-based learning' },
    { value: 'interactive', label: 'Interactive', desc: 'Free-form exploration with objectives' },
    { value: 'sandbox', label: 'Sandbox', desc: 'Open environment for experimentation' },
  ];

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
          Add New Lesson
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Page Type */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-4">
            Content Type
          </h2>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
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
                style={{ fontSize: '16px' }} // Prevents iOS zoom
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
              onClear={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
            />

            <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Or paste a video URL
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
                style={{ fontSize: '16px' }}
              />
              <p className="mt-2 text-xs text-surface-500">
                Supports direct video links (.mp4, .webm) or YouTube/Vimeo URLs
              </p>
            </div>

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
          </div>
        )}

        {/* Lab Configuration */}
        {formData.pageType === 'lab' && (
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700 space-y-6">
            <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5" />
              Lab Configuration
            </h2>

            {/* Lab Type */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Lab Type
              </label>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {labTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      labConfig.labType === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-600 hover:border-surface-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="labType"
                      value={option.value}
                      checked={labConfig.labType === option.value}
                      onChange={(e) => setLabConfig(prev => ({ ...prev, labType: e.target.value as typeof prev.labType }))}
                      className="sr-only"
                    />
                    <span className="font-medium text-surface-900 dark:text-white">{option.label}</span>
                    <span className="text-xs text-surface-500">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lab URL */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Lab URL (optional)
              </label>
              <input
                type="url"
                value={labConfig.labUrl}
                onChange={(e) => setLabConfig(prev => ({ ...prev, labUrl: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://lab.example.com/simulation"
                style={{ fontSize: '16px' }}
              />
              <p className="mt-2 text-xs text-surface-500">
                External lab environment URL (will be displayed in an iframe)
              </p>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Time Limit (minutes, optional)
              </label>
              <input
                type="number"
                min="0"
                value={labConfig.timeLimit || ''}
                onChange={(e) => setLabConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="30"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Objectives */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Learning Objectives
                </label>
                <button
                  type="button"
                  onClick={() => addLabItem('objectives')}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {labConfig.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => updateLabItem('objectives', index, e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Understand well logging principles"
                    />
                    {labConfig.objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLabItem('objectives', index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions/Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  Lab Instructions/Steps
                </label>
                <button
                  type="button"
                  onClick={() => addLabItem('instructions')}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>
              <div className="space-y-2">
                {labConfig.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm font-medium text-surface-500">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) => updateLabItem('instructions', index, e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Open the logging software and load the sample data"
                    />
                    {labConfig.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLabItem('instructions', index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Tools Available (optional)
                </label>
                <button
                  type="button"
                  onClick={() => addLabItem('tools')}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {labConfig.tools.map((tool, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={tool}
                      onChange={(e) => updateLabItem('tools', index, e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Log Viewer, Data Analyzer"
                    />
                    {labConfig.tools.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLabItem('tools', index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 md:p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-lg md:text-xl font-semibold text-surface-900 dark:text-white mb-2 md:mb-4">
            {formData.pageType === 'quiz' ? 'Quiz Instructions' : formData.pageType === 'lab' ? 'Lab Description' : 'Lesson Content'}
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
