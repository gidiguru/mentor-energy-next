'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Trash2, Plus, ChevronRight, Video, FileText } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface Page {
  id: string;
  title: string;
  pageType: string;
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  sequence: number;
  pages: Page[];
}

interface Module {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  duration: string | null;
  discipline: string | null;
  difficultyLevel: string | null;
  status: string;
  thumbnailUrl: string | null;
  learningObjectives: string[] | null;
  sections: Section[];
}

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleUuid = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);

  const [formData, setFormData] = useState({
    moduleId: '',
    title: '',
    description: '',
    duration: '',
    discipline: '',
    difficultyLevel: 'beginner',
    status: 'draft',
    thumbnailUrl: '',
    learningObjectives: [''],
  });

  const fetchModule = async () => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleUuid}`);
      if (response.ok) {
        const data = await response.json();
        const module = data.module;
        setFormData({
          moduleId: module.moduleId || '',
          title: module.title || '',
          description: module.description || '',
          duration: module.duration || '',
          discipline: module.discipline || '',
          difficultyLevel: module.difficultyLevel || 'beginner',
          status: module.status || 'draft',
          thumbnailUrl: module.thumbnailUrl || '',
          learningObjectives: module.learningObjectives?.length ? module.learningObjectives : [''],
        });
        setSections(module.sections || []);
      } else {
        setError('Module not found');
      }
    } catch (err) {
      setError('Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModule();
  }, [moduleUuid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learningObjectives];
    newObjectives[index] = value;
    setFormData(prev => ({ ...prev, learningObjectives: newObjectives }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, ''],
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  const handleThumbnailUpload = (file: { url: string }) => {
    setFormData(prev => ({ ...prev, thumbnailUrl: file.url }));
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;

    setAddingSection(true);
    try {
      const response = await fetch(`/api/admin/modules/${moduleUuid}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSectionTitle }),
      });

      if (response.ok) {
        setNewSectionTitle('');
        await fetchModule(); // Refresh to get updated sections
      }
    } catch (err) {
      console.error('Failed to add section');
    } finally {
      setAddingSection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/modules/${moduleUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          learningObjectives: formData.learningObjectives.filter(o => o.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update module');
      }

      router.push('/admin/modules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update module');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/modules"
          className="inline-flex items-center text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Modules
        </Link>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
          Edit Module
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-6">
            Basic Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Module Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Module ID
              </label>
              <input
                type="text"
                name="moduleId"
                value={formData.moduleId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 4 hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Discipline
              </label>
              <select
                name="discipline"
                value={formData.discipline}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select discipline</option>
                <option value="petroleum">Petroleum Engineering</option>
                <option value="drilling">Drilling</option>
                <option value="production">Production</option>
                <option value="reservoir">Reservoir</option>
                <option value="geology">Geology</option>
                <option value="geophysics">Geophysics</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Difficulty Level
              </label>
              <select
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <FileUpload
                label="Thumbnail Image"
                hint="Upload a cover image for this module"
                accept="image/*"
                maxSize={10 * 1024 * 1024}
                currentUrl={formData.thumbnailUrl}
                onUpload={handleThumbnailUpload}
              />
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
              Learning Objectives
            </h2>
            <button
              type="button"
              onClick={addObjective}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Objective
            </button>
          </div>

          <div className="space-y-3">
            {formData.learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="What will students learn?"
                />
                {formData.learningObjectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="p-2 text-surface-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sections & Content */}
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-6">
            Sections & Lessons
          </h2>

          {/* Add Section */}
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="New section title..."
              className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddSection}
              disabled={addingSection || !newSectionTitle.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium transition-colors"
            >
              {addingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Section
            </button>
          </div>

          {/* Sections List */}
          {sections.length === 0 ? (
            <p className="text-surface-500 text-center py-8">
              No sections yet. Add a section above to start building content.
            </p>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="border border-surface-200 dark:border-surface-600 rounded-lg overflow-hidden"
                >
                  <div className="p-4 bg-surface-50 dark:bg-surface-700 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-surface-500">Section {index + 1}</span>
                      <h3 className="font-medium text-surface-900 dark:text-white">{section.title}</h3>
                    </div>
                    <Link
                      href={`/admin/modules/${moduleUuid}/sections/${section.id}/pages/new`}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Lesson
                    </Link>
                  </div>

                  {section.pages.length > 0 && (
                    <div className="divide-y divide-surface-100 dark:divide-surface-700">
                      {section.pages.map((page) => (
                        <div key={page.id} className="p-3 flex items-center gap-3 hover:bg-surface-50 dark:hover:bg-surface-700/50">
                          {page.pageType === 'lesson' ? (
                            <FileText className="w-4 h-4 text-primary-500" />
                          ) : (
                            <Video className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="flex-1 text-surface-700 dark:text-surface-300">{page.title}</span>
                          <ChevronRight className="w-4 h-4 text-surface-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {section.pages.length === 0 && (
                    <p className="p-3 text-sm text-surface-500">No lessons in this section</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/modules"
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
