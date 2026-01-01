'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, BookOpen, FileText, FolderOpen } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  type: 'module' | 'section' | 'lesson';
  id: string;
  title: string;
  description: string | null;
  url: string;
  moduleId: string;
  moduleName: string;
  sectionName?: string;
  pageType?: string;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'module':
        return <FolderOpen className="w-4 h-4" />;
      case 'section':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'module':
        return 'Course';
      case 'section':
        return 'Section';
      default:
        return 'Lesson';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-surface-200 dark:border-surface-700">
          <Search className="w-5 h-5 text-surface-400" />
          <label htmlFor="search-input" className="sr-only">Search courses, sections, and lessons</label>
          <input
            id="search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, sections, and lessons..."
            className="flex-1 bg-transparent text-surface-900 dark:text-white placeholder-surface-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin text-surface-400" aria-label="Loading search results" />}
          <button onClick={onClose} className="p-1 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300" aria-label="Close search">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!hasSearched && (
            <div className="p-8 text-center text-surface-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Start typing to search...</p>
            </div>
          )}

          {hasSearched && !loading && results.length === 0 && (
            <div className="p-8 text-center text-surface-500">
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  onClick={onClose}
                  className="flex items-start gap-3 p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                >
                  <div className={`mt-1 p-2 rounded-lg ${
                    result.type === 'module'
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                      : result.type === 'section'
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-900 dark:text-white truncate">
                        {result.title}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        result.type === 'module'
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : result.type === 'section'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.type !== 'module' && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {result.moduleName}
                        {result.sectionName && ` › ${result.sectionName}`}
                      </p>
                    )}
                    {result.description && (
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-xs text-surface-500">
          <span>Press <kbd className="px-1.5 py-0.5 bg-surface-200 dark:bg-surface-700 rounded">ESC</kbd> to close</span>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
