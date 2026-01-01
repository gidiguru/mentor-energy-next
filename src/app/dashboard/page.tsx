'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Flame, Trophy, Medal, BookOpen, Award, TrendingUp, Bookmark, Clock, ChevronRight, GraduationCap, BarChart3, FileText, Download, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  discipline: string | null;
  qualification: string | null;
  university: string | null;
  role: string;
}

interface Module {
  id: string;
  moduleSlug: string;
  title: string;
  description: string;
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  nextLessonLink?: string | null;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned: boolean;
  earnedAt?: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  value: number;
  isCurrentUser: boolean;
}

interface Bookmark {
  id: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  lessonLink: string | null;
  createdAt: string;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  completedAt: string;
  module: {
    id: string;
    title: string;
    moduleSlug: string;
  };
}

interface DashboardStats {
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  progressPercentage: number;
  totalPoints: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    completedLessons: 0,
    totalLessons: 0,
    completedModules: 0,
    totalModules: 0,
    progressPercentage: 0,
    totalPoints: 0,
  });
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isMentor, setIsMentor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        const [
          profileRes,
          enrollmentsRes,
          streakRes,
          achievementsRes,
          leaderboardRes,
          bookmarksRes,
          certificatesRes,
        ] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/enrollments'),
          fetch('/api/streaks'),
          fetch('/api/achievements'),
          fetch('/api/leaderboard?type=points&limit=5'),
          fetch('/api/bookmarks'),
          fetch('/api/certificates'),
        ]);

        // Process profile and check for mentor redirect
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.profile);
          setIsMentor(data.isMentor || false);

          // Redirect mentors to mentoring dashboard
          if (data.isMentor) {
            router.replace('/dashboard/mentoring');
            return;
          }
        }

        // Process enrolled courses with progress
        if (enrollmentsRes.ok) {
          const data = await enrollmentsRes.json();
          const enrolledModules = (data.enrollments || []).map((e: {
            moduleId: string;
            moduleSlug: string;
            title: string;
            description: string;
            thumbnailUrl: string | null;
            progress?: number;
            totalLessons?: number;
            completedLessons?: number;
            nextLessonLink?: string | null;
          }) => ({
            id: e.moduleId,
            moduleSlug: e.moduleSlug,
            title: e.title,
            description: e.description,
            progress: e.progress || 0,
            totalLessons: e.totalLessons || 0,
            completedLessons: e.completedLessons || 0,
            nextLessonLink: e.nextLessonLink,
          }));
          setModules(enrolledModules);

          const modulesWithProgress = enrolledModules;

          // Calculate overall stats
          let totalLessons = 0;
          let completedLessons = 0;
          let completedModules = 0;

          for (const mod of modulesWithProgress) {
            totalLessons += mod.totalLessons || 0;
            completedLessons += mod.completedLessons || 0;
            if (mod.progress === 100) {
              completedModules++;
            }
          }

          const progressPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

          setStats({
            completedLessons,
            totalLessons,
            completedModules,
            totalModules: modulesWithProgress.length,
            progressPercentage,
            totalPoints: 0,
          });
        }

        // Process streak
        if (streakRes.ok) {
          const data = await streakRes.json();
          setStreak(data);
        }

        // Process achievements
        if (achievementsRes.ok) {
          const data = await achievementsRes.json();
          setAchievements(data.achievements || []);

          // Calculate total points from earned achievements
          const earnedAchievements = (data.achievements || []).filter((a: Achievement) => a.earned);
          const totalPoints = earnedAchievements.reduce((sum: number, a: Achievement) => sum + a.points, 0);
          setStats(prev => ({ ...prev, totalPoints }));
        }

        // Process leaderboard
        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          setLeaderboard(data.leaderboard || []);
        }

        // Process bookmarks
        if (bookmarksRes.ok) {
          const data = await bookmarksRes.json();
          setBookmarks(data.bookmarks || []);
        }

        // Process certificates
        if (certificatesRes.ok) {
          const data = await certificatesRes.json();
          setCertificates(data.certificates || []);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [user, isLoaded]);

  if (loading || !isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const displayName = profile?.first_name || user?.firstName || 'User';
  const earnedAchievements = achievements.filter(a => a.earned);
  const recentAchievements = earnedAchievements
    .sort((a, b) => new Date(b.earnedAt || 0).getTime() - new Date(a.earnedAt || 0).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="space-y-4">
        <h1 className="h1">Welcome back, {displayName}</h1>
        <p className="text-surface-500 dark:text-surface-300">
          Your learning progress: {stats.progressPercentage}% ({stats.completedLessons}/{stats.totalLessons} lessons)
        </p>

        {/* Progress bar */}
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${stats.progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Streak */}
        <div className="card preset-filled-surface-100-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{streak?.currentStreak || 0}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Points */}
        <div className="card preset-filled-surface-100-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{stats.totalPoints}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">Points</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="card preset-filled-surface-100-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
              <Medal className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-500">{earnedAchievements.length}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">Achievements</p>
            </div>
          </div>
        </div>

        {/* Lessons */}
        <div className="card preset-filled-surface-100-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.completedLessons}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">Lessons Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Detailed Analytics Button */}
      <Link
        href="/dashboard/analytics"
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        <BarChart3 className="w-5 h-5" />
        View Detailed Analytics
        <ChevronRight className="w-5 h-5" />
      </Link>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Progress & Modules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Modules */}
          <section className="card preset-filled-surface-100-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="h3">Your Courses</h2>
              <Link
                href="/learn"
                className="text-primary-500 hover:underline text-sm flex items-center gap-1"
              >
                <GraduationCap className="w-4 h-4" />
                Learning Center
              </Link>
            </div>
            {modules.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {modules.slice(0, 4).map((module) => (
                    <Link
                      key={module.id}
                      href={module.nextLessonLink || `/learn/${module.moduleSlug}`}
                      className="block rounded-lg border border-surface-200 dark:border-surface-700 p-4 hover:border-primary-500 transition-colors"
                    >
                      <h3 className="font-medium mb-2 line-clamp-1">{module.title}</h3>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            module.progress === 100 ? 'bg-green-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${module.progress || 0}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {module.progress === 100 ? (
                            <span className="text-green-500 font-medium">Completed!</span>
                          ) : module.progress && module.progress > 0 ? (
                            `${module.completedLessons}/${module.totalLessons} lessons`
                          ) : (
                            'Not started'
                          )}
                        </p>
                        <span className="text-xs text-primary-500 flex items-center gap-1">
                          {module.progress === 100 ? 'Review' : module.progress && module.progress > 0 ? 'Continue' : 'Start'}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* Continue Learning Button */}
                {modules.some(m => m.progress !== 100 && m.nextLessonLink) && (
                  <Link
                    href={modules.find(m => m.progress !== 100 && m.nextLessonLink)?.nextLessonLink || '/learn'}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-5 h-5" />
                    Continue Learning
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-surface-400 mb-3" />
                <p className="text-surface-500 dark:text-surface-400 mb-4">
                  You haven&apos;t enrolled in any courses yet.
                </p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <GraduationCap className="w-4 h-4" />
                  Browse Courses
                </Link>
              </div>
            )}
          </section>

          {/* Recent Achievements */}
          <section className="card preset-filled-surface-100-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="h3 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Recent Achievements
              </h2>
              <span className="text-sm text-surface-500">
                {earnedAchievements.length}/{achievements.length} unlocked
              </span>
            </div>
            {recentAchievements.length > 0 ? (
              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-900/20 p-3"
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{achievement.name}</p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {achievement.description}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      +{achievement.points} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-surface-500 dark:text-surface-400">
                Complete lessons to earn achievements!
              </p>
            )}
          </section>

          {/* Bookmarks */}
          {bookmarks.length > 0 && (
            <section className="card preset-filled-surface-100-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="h3 flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-blue-500" />
                  Bookmarked Lessons
                </h2>
              </div>
              <div className="space-y-2">
                {bookmarks.slice(0, 3).map((bookmark) => (
                  <Link
                    key={bookmark.id}
                    href={bookmark.lessonLink || '/learn'}
                    className="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-700 p-3 hover:border-primary-500 transition-colors"
                  >
                    <Bookmark className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{bookmark.lessonTitle}</p>
                      <p className="text-sm text-surface-500 truncate">{bookmark.moduleTitle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-400" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* My Certificates */}
          {certificates.length > 0 && (
            <section className="card preset-filled-surface-100-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="h3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  My Certificates
                </h2>
                <span className="text-sm text-surface-500">
                  {certificates.length} earned
                </span>
              </div>
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 p-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-white truncate">
                        {cert.module.title}
                      </p>
                      <p className="text-sm text-surface-500">
                        Completed {new Date(cert.completedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-surface-400 font-mono">
                        {cert.certificateNumber}
                      </p>
                    </div>
                    <a
                      href={`/api/certificates/${cert.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Leaderboard & Actions */}
        <div className="space-y-6">
          {/* Streak Details */}
          {streak && (
            <section className="card preset-filled-surface-100-900 p-6">
              <h2 className="h3 flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                Learning Streak
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-surface-500 dark:text-surface-400">Current Streak</span>
                  <span className="text-xl font-bold text-orange-500">{streak.currentStreak} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-500 dark:text-surface-400">Longest Streak</span>
                  <span className="text-xl font-bold">{streak.longestStreak} days</span>
                </div>
                {streak.lastActivityDate && (
                  <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                    <Clock className="h-4 w-4" />
                    Last activity: {new Date(streak.lastActivityDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Leaderboard */}
          <section className="card preset-filled-surface-100-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="h3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500" />
                Leaderboard
              </h2>
            </div>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-lg p-2 ${
                      entry.isCurrentUser
                        ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700'
                        : ''
                    }`}
                  >
                    <span className={`w-6 text-center font-bold ${
                      entry.rank === 1 ? 'text-yellow-500' :
                      entry.rank === 2 ? 'text-gray-400' :
                      entry.rank === 3 ? 'text-amber-600' : ''
                    }`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {entry.firstName} {entry.lastName?.[0]}.
                        {entry.isCurrentUser && <span className="text-primary-500 ml-1">(You)</span>}
                      </p>
                    </div>
                    <span className="font-bold text-primary-500">{entry.value} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-surface-500 dark:text-surface-400">
                Complete lessons to appear on the leaderboard!
              </p>
            )}
          </section>

          {/* Quick Actions */}
          <section className="card preset-filled-surface-100-900 p-6">
            <h2 className="h3 mb-4">Quick Actions</h2>
            <div className="grid gap-2">
              <Link
                href="/learn"
                className="btn preset-filled-primary-500 w-full"
              >
                Browse Courses
              </Link>
              {isMentor ? (
                <Link
                  href="/dashboard/mentoring"
                  className="btn preset-filled-secondary-500 w-full flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Mentoring Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard/mentorship"
                  className="btn preset-filled-secondary-500 w-full"
                >
                  Book Mentorship
                </Link>
              )}
              <Link href="/profile" className="btn preset-outlined-surface-500 w-full">
                Update Profile
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
