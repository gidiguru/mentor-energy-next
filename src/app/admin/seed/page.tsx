'use client';

import { useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2, Trophy, Mail } from 'lucide-react';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: { modules: number; sections: number; pages: number; resources: number };
  } | null>(null);
  const [achievementsResult, setAchievementsResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          data: data.data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to seed database',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAchievements = async () => {
    setAchievementsLoading(true);
    setAchievementsResult(null);

    try {
      const response = await fetch('/api/admin/seed-achievements', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setAchievementsResult({
          success: true,
          message: data.message,
          count: data.total,
        });
      } else {
        setAchievementsResult({
          success: false,
          message: data.error || 'Failed to seed achievements',
        });
      }
    } catch (error) {
      setAchievementsResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setAchievementsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailLoading(true);
    setEmailResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setEmailResult({
          success: true,
          message: data.message || 'Test email sent successfully!',
        });
      } else {
        setEmailResult({
          success: false,
          message: data.error || 'Failed to send test email',
        });
      }
    } catch (error) {
      setEmailResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Seed Database
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          Populate the database with sample petroleum engineering content.
        </p>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 max-w-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              Sample Content
            </h2>
            <p className="text-surface-600 dark:text-surface-400 text-sm">
              This will add the following sample content to your database:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-surface-600 dark:text-surface-400">
              <li>• 5 learning modules (petroleum, drilling, geology)</li>
              <li>• 25 sections with curriculum content</li>
              <li>• Sample lesson pages with markdown content</li>
              <li>• 6 resources (articles, videos, documents)</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Seeding Database...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Seed Sample Data
              </>
            )}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${
                    result.success
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {result.message}
                  </p>
                  {result.data && (
                    <ul className="mt-2 text-sm text-green-700 dark:text-green-400">
                      <li>✓ {result.data.modules} modules created</li>
                      <li>✓ {result.data.sections} sections created</li>
                      <li>✓ {result.data.pages} pages created</li>
                      <li>✓ {result.data.resources} resources created</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-surface-500 dark:text-surface-400">
          Note: Running this multiple times may create duplicate content.
        </p>
      </div>

      {/* Achievements Seeding Section */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 max-w-2xl mt-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              Achievements
            </h2>
            <p className="text-surface-600 dark:text-surface-400 text-sm">
              Seed the gamification achievements for user progress tracking:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-surface-600 dark:text-surface-400">
              <li>• 6 completion achievements (lesson milestones)</li>
              <li>• 4 streak achievements (daily learning streaks)</li>
              <li>• 3 certificate achievements (earning certificates)</li>
              <li>• 2 engagement achievements (commenting)</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
          <button
            onClick={handleSeedAchievements}
            disabled={achievementsLoading}
            className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {achievementsLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Seeding Achievements...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                Seed Achievements
              </>
            )}
          </button>

          {achievementsResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              achievementsResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {achievementsResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${
                    achievementsResult.success
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {achievementsResult.message}
                  </p>
                  {achievementsResult.count !== undefined && (
                    <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                      Total achievements in database: {achievementsResult.count}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-surface-500 dark:text-surface-400">
          Note: This is safe to run multiple times - only new achievements will be added.
        </p>
      </div>

      {/* Test Email Section */}
      <div className="bg-white dark:bg-surface-800 rounded-xl p-8 border border-surface-200 dark:border-surface-700 max-w-2xl mt-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              Test Email
            </h2>
            <p className="text-surface-600 dark:text-surface-400 text-sm">
              Send a test certificate email to verify your email configuration is working.
              The email will be sent to your admin email address.
            </p>
          </div>
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-6">
          <button
            onClick={handleTestEmail}
            disabled={emailLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {emailLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Send Test Email
              </>
            )}
          </button>

          {emailResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              emailResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {emailResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <p className={`font-medium ${
                  emailResult.success
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  {emailResult.message}
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-surface-500 dark:text-surface-400">
          Check your inbox (and spam folder) for the test certificate email.
        </p>
      </div>
    </div>
  );
}
