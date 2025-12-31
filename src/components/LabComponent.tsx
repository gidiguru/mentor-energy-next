'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Target,
  ListChecks,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface LabConfig {
  labType: 'simulation' | 'interactive' | 'sandbox' | 'guided';
  labUrl?: string;
  instructions: string[];
  objectives: string[];
  tools?: string[];
  scenarios?: Array<{
    id: string;
    name: string;
    description: string;
    data?: Record<string, unknown>;
  }>;
  timeLimit?: number; // in minutes
  completionCriteria?: {
    requiredSteps?: number;
    minScore?: number;
  };
}

interface LabComponentProps {
  pageId: string;
  title: string;
  labConfig: LabConfig;
  onComplete?: (completed: boolean, data?: Record<string, unknown>) => void;
}

export default function LabComponent({ pageId, title, labConfig, onComplete }: LabComponentProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showObjectives, setShowObjectives] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [labProgress, setLabProgress] = useState<Record<string, unknown> | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(
    labConfig.scenarios?.[0]?.id || null
  );

  const { labType, labUrl, instructions, objectives, tools, scenarios, timeLimit } = labConfig;

  // Load saved progress
  useEffect(() => {
    async function loadProgress() {
      try {
        const response = await fetch(`/api/lab-progress?pageId=${pageId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.progress) {
            setLabProgress(data.progress);
            setCompletedSteps(new Set(data.progress.completedSteps || []));
            setElapsedTime(data.progress.elapsedTime || 0);
            if (data.progress.isStarted) {
              setIsStarted(true);
            }
          }
        }
      } catch (err) {
        console.error('Error loading lab progress:', err);
      }
    }
    loadProgress();
  }, [pageId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isStarted && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          // Check time limit
          if (timeLimit && newTime >= timeLimit * 60) {
            setIsPaused(true);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, isPaused, timeLimit]);

  // Save progress periodically
  const saveProgress = useCallback(async () => {
    try {
      await fetch('/api/lab-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          progress: {
            isStarted,
            completedSteps: Array.from(completedSteps),
            elapsedTime,
            selectedScenario,
            lastUpdated: new Date().toISOString(),
          },
        }),
      });
    } catch (err) {
      console.error('Error saving lab progress:', err);
    }
  }, [pageId, isStarted, completedSteps, elapsedTime, selectedScenario]);

  // Auto-save every 30 seconds when active
  useEffect(() => {
    if (!isStarted || isPaused) return;

    const saveInterval = setInterval(saveProgress, 30000);
    return () => clearInterval(saveInterval);
  }, [isStarted, isPaused, saveProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsStarted(true);
    setIsPaused(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    saveProgress();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your lab progress? This cannot be undone.')) {
      setIsStarted(false);
      setIsPaused(false);
      setElapsedTime(0);
      setCompletedSteps(new Set());
      setLabProgress(null);
    }
  };

  const toggleStep = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);

    // Check if all steps completed
    if (newCompleted.size === instructions.length) {
      onComplete?.(true, {
        completedSteps: Array.from(newCompleted),
        elapsedTime,
        scenario: selectedScenario,
      });
    }
  };

  const handleComplete = () => {
    saveProgress();
    onComplete?.(true, {
      completedSteps: Array.from(completedSteps),
      elapsedTime,
      scenario: selectedScenario,
    });
  };

  const isLabComplete = completedSteps.size === instructions.length;
  const progressPercentage = instructions.length > 0
    ? Math.round((completedSteps.size / instructions.length) * 100)
    : 0;

  const labTypeLabels: Record<string, { label: string; color: string }> = {
    simulation: { label: 'Simulation', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    interactive: { label: 'Interactive', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    sandbox: { label: 'Sandbox', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    guided: { label: 'Guided Lab', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  };

  return (
    <div className="space-y-6">
      {/* Lab Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${labTypeLabels[labType]?.color || 'bg-gray-100 text-gray-700'}`}>
                  {labTypeLabels[labType]?.label || labType}
                </span>
                {timeLimit && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeLimit} min limit
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
          </div>

          {isStarted && (
            <div className="text-right">
              <p className="text-sm text-white/80">Time Elapsed</p>
              <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isStarted && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{completedSteps.size} of {instructions.length} steps completed</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pre-Lab Info */}
      {!isStarted && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Objectives */}
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-surface-900 dark:text-white">Learning Objectives</h3>
            </div>
            <ul className="space-y-2">
              {objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          {/* Tools/Requirements */}
          {tools && tools.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-surface-900 dark:text-white">Tools Available</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-sm text-surface-700 dark:text-surface-300"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scenario Selection */}
      {scenarios && scenarios.length > 0 && !isStarted && (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Select a Scenario</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedScenario === scenario.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-600 hover:border-primary-300'
                }`}
              >
                <h4 className="font-medium text-surface-900 dark:text-white mb-1">{scenario.name}</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">{scenario.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start Button */}
      {!isStarted && (
        <button
          onClick={handleStart}
          disabled={scenarios && scenarios.length > 0 && !selectedScenario}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Virtual Lab
        </button>
      )}

      {/* Active Lab Interface */}
      {isStarted && (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePause}
                className={`p-2 rounded-lg transition-colors ${
                  isPaused
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                }`}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              {labUrl && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              )}
            </div>

            {isPaused && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Lab Paused</span>
              </div>
            )}

            {isLabComplete && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Complete
              </button>
            )}
          </div>

          {/* Lab Environment */}
          {labUrl ? (
            <div className={`bg-surface-900 rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
              {loading ? (
                <div className="w-full aspect-video flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : (
                <iframe
                  src={labUrl}
                  className={`w-full ${isFullscreen ? 'h-full' : 'aspect-video'}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                  title={title}
                />
              )}
              {isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-surface-100 dark:bg-surface-800 rounded-xl p-8 text-center border-2 border-dashed border-surface-300 dark:border-surface-600">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-surface-400" />
              <p className="text-surface-600 dark:text-surface-400 mb-2">
                Built-in lab environment coming soon
              </p>
              <p className="text-sm text-surface-500">
                Follow the instructions below to complete this lab
              </p>
            </div>
          )}

          {/* Collapsible Sections */}
          <div className="space-y-4">
            {/* Objectives */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <button
                onClick={() => setShowObjectives(!showObjectives)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-surface-900 dark:text-white">Objectives</span>
                </div>
                {showObjectives ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showObjectives && (
                <div className="px-6 pb-4">
                  <ul className="space-y-2">
                    {objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Instructions/Steps */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50"
              >
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-surface-900 dark:text-white">
                    Instructions ({completedSteps.size}/{instructions.length})
                  </span>
                </div>
                {showInstructions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showInstructions && (
                <div className="px-6 pb-4">
                  <ul className="space-y-3">
                    {instructions.map((instruction, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <button
                          onClick={() => toggleStep(index)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            completedSteps.has(index)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-surface-300 dark:border-surface-600 hover:border-primary-500'
                          }`}
                        >
                          {completedSteps.has(index) && <CheckCircle className="w-4 h-4" />}
                        </button>
                        <span className={`text-sm ${
                          completedSteps.has(index)
                            ? 'text-surface-400 line-through'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}>
                          <span className="font-medium">Step {index + 1}:</span> {instruction}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* External Link */}
      {labUrl && !isStarted && (
        <a
          href={labUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          <ExternalLink className="w-4 h-4" />
          Open lab in new window
        </a>
      )}
    </div>
  );
}
