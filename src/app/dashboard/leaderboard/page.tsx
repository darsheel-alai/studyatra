"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";
import { UserButton } from "@clerk/nextjs";

type LeaderboardEntry = {
  user_id: string;
  total_xp?: number;
  current_streak?: number;
  tests_completed?: number;
  quizzes_completed?: number;
  total_test_score?: number;
  total_quiz_score?: number;
  total_points?: number;
  rank: number;
};

export default function LeaderboardPage() {
  const { user, isLoaded } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [type, setType] = useState<"overall" | "tests" | "quizzes">("overall");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      fetchLeaderboard();
    }
  }, [isLoaded, type]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
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
            <h1 className="text-lg font-semibold text-slate-100">Leaderboard</h1>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </div>
        </header>
        <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Top Performers</h2>
            <p className="text-sm text-slate-400 mb-4">
              {type === "overall" 
                ? "Leaderboard based on combined test and quiz points. Take tests and quizzes to climb the ranks!"
                : type === "tests"
                ? "Leaderboard based on total test scores. Complete tests to earn points!"
                : "Leaderboard based on total quiz scores. Complete quizzes to earn points!"}
            </p>
            {userRank && userRank > 0 && (
              <div className="mb-4 p-3 bg-[#5A4FFF]/20 border border-[#5A4FFF]/50 rounded-lg">
                <span className="text-sm text-slate-300">Your Rank: </span>
                <span className="text-[#5A4FFF] font-bold">#{userRank}</span>
                {type === "overall" && (
                  <span className="text-xs text-slate-400 ml-2">
                    (Based on your test + quiz points)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setType("overall")}
              className={`px-4 py-2 rounded-lg transition-all ${
                type === "overall"
                  ? "bg-[#5A4FFF] text-white"
                  : "bg-slate-800/50 text-slate-300"
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setType("tests")}
              className={`px-4 py-2 rounded-lg transition-all ${
                type === "tests"
                  ? "bg-[#5A4FFF] text-white"
                  : "bg-slate-800/50 text-slate-300"
              }`}
            >
              Tests
            </button>
            <button
              onClick={() => setType("quizzes")}
              className={`px-4 py-2 rounded-lg transition-all ${
                type === "quizzes"
                  ? "bg-[#5A4FFF] text-white"
                  : "bg-slate-800/50 text-slate-300"
              }`}
            >
              Quizzes
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#5A4FFF] border-t-transparent"></div>
              <p className="text-slate-400">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-8">
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user_id === user?.id;
                  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                  
                  return (
                    <div
                      key={entry.user_id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isCurrentUser
                          ? "border-[#5A4FFF] bg-[#5A4FFF]/10"
                          : "border-slate-700 bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold w-12 text-center">
                            {medal || `#${entry.rank}`}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100">
                              {isCurrentUser ? "You" : `User ${entry.user_id.slice(0, 8)}`}
                            </div>
                            {type === "overall" && (
                              <div className="text-sm text-slate-400">
                                {(entry.total_points || 0)} points • {entry.tests_completed || 0} tests • {entry.quizzes_completed || 0} quizzes
                              </div>
                            )}
                            {type === "tests" && (
                              <div className="text-sm text-slate-400">
                                {entry.total_test_score || 0} total score • {entry.tests_completed || 0} tests
                              </div>
                            )}
                            {type === "quizzes" && (
                              <div className="text-sm text-slate-400">
                                {entry.total_quiz_score || 0} total score • {entry.quizzes_completed || 0} quizzes
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {type === "overall" && (
                            <div className="text-lg font-bold text-[#5A4FFF]">
                              {entry.total_points || 0} pts
                            </div>
                          )}
                          {type === "tests" && (
                            <div className="text-lg font-bold text-[#5A4FFF]">
                              {entry.total_test_score || 0}
                            </div>
                          )}
                          {type === "quizzes" && (
                            <div className="text-lg font-bold text-[#5A4FFF]">
                              {entry.total_quiz_score || 0}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    No entries yet. Be the first to appear on the leaderboard!
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
