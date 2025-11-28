"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";
import { UserButton } from "@clerk/nextjs";

type Stats = {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  tests_completed: number;
  quizzes_completed: number;
  total_test_score: number;
  total_quiz_score: number;
};

type LeaderboardEntry = {
  user_id: string;
  total_points?: number;
  tests_completed?: number;
  quizzes_completed?: number;
  rank: number;
};

export default function ProgressPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch overall leaderboard
      const leaderboardResponse = await fetch('/api/leaderboard?type=overall');
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.leaderboard || []);
        setUserRank(leaderboardData.userRank);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#5A4FFF] border-t-transparent"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="mx-auto flex w-full items-center justify-between px-5 py-4 section-max-width sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-slate-100">Progress & Analytics</h1>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </header>

        <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Stats Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Your Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-6">
                <div className="text-slate-400 text-sm mb-2">Total XP</div>
                <div className="text-3xl font-bold text-[#5A4FFF]">{stats?.total_xp || 0}</div>
                <div className="text-xs text-slate-500 mt-1">From tests & quizzes</div>
              </div>
              <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-6">
                <div className="text-slate-400 text-sm mb-2">Tests Completed</div>
                <div className="text-3xl font-bold text-green-400">{stats?.tests_completed || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Total score: {stats?.total_test_score || 0}</div>
              </div>
              <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-6">
                <div className="text-slate-400 text-sm mb-2">Quizzes Completed</div>
                <div className="text-3xl font-bold text-cyan-400">{stats?.quizzes_completed || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Total score: {stats?.total_quiz_score || 0}</div>
              </div>
              <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-6">
                <div className="text-slate-400 text-sm mb-2">Gaming Streak</div>
                <div className="text-3xl font-bold text-orange-400">🔥 {stats?.current_streak || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Longest: {stats?.longest_streak || 0} days</div>
              </div>
            </div>
          </div>

          {/* Overall Leaderboard Table */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Overall Leaderboard</h2>
                <p className="text-sm text-slate-400">
                  Rankings based on combined test and quiz points
                </p>
              </div>
              {userRank && userRank > 0 && (
                <div className="px-4 py-2 bg-[#5A4FFF]/20 border border-[#5A4FFF]/50 rounded-lg">
                  <span className="text-sm text-slate-300">Your Rank: </span>
                  <span className="text-[#5A4FFF] font-bold">#{userRank}</span>
                </div>
              )}
            </div>

            <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">User</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Total Points</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Tests</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Quizzes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {leaderboard.map((entry, index) => {
                      const isCurrentUser = entry.user_id === user?.id;
                      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                      
                      return (
                        <tr
                          key={entry.user_id}
                          className={`transition-colors ${
                            isCurrentUser
                              ? "bg-[#5A4FFF]/10 hover:bg-[#5A4FFF]/20"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {medal ? (
                                <span className="text-2xl">{medal}</span>
                              ) : (
                                <span className="text-slate-300 font-semibold">#{entry.rank}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-100">
                              {isCurrentUser ? "You" : `User ${entry.user_id.slice(0, 8)}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-lg font-bold text-[#5A4FFF]">
                              {entry.total_points || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400">
                            {entry.tests_completed || 0}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400">
                            {entry.quizzes_completed || 0}
                          </td>
                        </tr>
                      );
                    })}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No entries yet. Take tests and quizzes to appear on the leaderboard!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Progress Breakdown */}
          {stats && (stats.tests_completed > 0 || stats.quizzes_completed > 0) && (
            <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Activity Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Test Points</span>
                    <span className="text-sm font-semibold text-green-400">{stats.total_test_score || 0} pts</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{
                        width: `${((stats.total_test_score || 0) / ((stats.total_test_score || 0) + (stats.total_quiz_score || 0) || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Quiz Points</span>
                    <span className="text-sm font-semibold text-cyan-400">{stats.total_quiz_score || 0} pts</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{
                        width: `${((stats.total_quiz_score || 0) / ((stats.total_test_score || 0) + (stats.total_quiz_score || 0) || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-slate-300">Total Points</span>
                    <span className="text-lg font-bold text-[#5A4FFF]">
                      {(stats.total_test_score || 0) + (stats.total_quiz_score || 0)} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
