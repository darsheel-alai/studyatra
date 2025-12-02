"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";

type OnboardingStatus = {
  onboarding_completed: boolean;
  invoice_verified: boolean;
  access_key_verified: boolean;
  order_id: string | null;
} | null;

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(null);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);

  // Fetch onboarding status only when logged in
  useEffect(() => {
    const fetchStatus = async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        setIsOnboardingLoading(true);
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const data = await res.json();
          setOnboardingStatus(data);
        }
      } catch (e) {
        console.error("Failed to fetch onboarding status on home:", e);
      } finally {
        setIsOnboardingLoading(false);
      }
    };

    fetchStatus();
  }, [isLoaded, isSignedIn]);

  const isVerified =
    !!onboardingStatus?.invoice_verified || !!onboardingStatus?.onboarding_completed;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="gradient-hero">
        <header className="mx-auto flex w-full items-center justify-between px-5 py-5 section-max-width sm:px-6 lg:px-0 lg:py-7">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-800/80 ring-1 ring-slate-700/60">
              <span className="text-lg font-extrabold text-[#5A4FFF]">S</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight text-slate-100">
                Studyatra
              </span>
              <span className="text-xs text-slate-400">
                AI-Powered Study Companion
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a
              href="#features"
              className="hover:text-indigo-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-indigo-400 transition-colors"
            >
              How it helps
            </a>
            <a
              href="#pricing"
              className="hover:text-indigo-400 transition-colors"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!isSignedIn && (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full border border-slate-700 bg-slate-800/70 px-4 py-1.5 text-xs font-semibold text-slate-200 shadow-sm backdrop-blur-sm hover:border-[#5A4FFF]/40 hover:text-[#5A4FFF] md:inline-flex transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[#5A4FFF] px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5] transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}

            {isSignedIn && (
              <>
                {isVerified && !isOnboardingLoading && (
                  <Link
                    href="/dashboard"
                    className="hidden rounded-full border border-slate-700 bg-slate-800/70 px-4 py-1.5 text-xs font-semibold text-slate-200 shadow-sm backdrop-blur-sm hover:border-[#5A4FFF]/40 hover:text-[#5A4FFF] md:inline-flex transition-colors"
                  >
                    Go to dashboard
                  </Link>
                )}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <main className="mx-auto px-5 pb-14 pt-2 section-max-width sm:px-6 lg:px-0 lg:pb-20 lg:pt-4">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            {/* Hero copy */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00C2A8]/20 text-[10px] font-bold text-[#00C2A8]">
                  AI
                </span>
                <span>Designed for Indian students of classes 8–12</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.08]">
                  Study smarter with{" "}
                  <span className="bg-gradient-to-r from-[#5A4FFF] via-[#7C5CFF] to-[#00C2A8] bg-clip-text text-transparent">
                    your AI study partner
                  </span>
                  .
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-slate-400 sm:text-[0.95rem]">
                  Studyatra turns your syllabus into a guided journey — chat
                  with AI in simple language, get NCERT-style notes, solve photo
                  questions, and practice with quizzes, tests, and smart
                  timetables made just for you.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isSignedIn && isVerified ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full bg-[#5A4FFF] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5] transition-colors"
                  >
                    Go to dashboard
                  </Link>
                ) : (
                  <>
                    <a
                      href="https://www.thekidcompany.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-[#5A4FFF] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5] transition-colors"
                    >
                      Get Studyatra for ₹300
                    </a>
                    {isSignedIn && !isVerified && (
                      <Link
                        href="/onboarding"
                        className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 px-6 py-2 text-sm font-semibold text-slate-200 shadow-sm backdrop-blur hover:border-[#5A4FFF]/50 hover:text-[#5A4FFF] transition-colors"
                      >
                        Verify payment
                      </Link>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:text-[0.72rem]">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="h-7 w-7 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-[#5A4FFF] to-[#00C2A8]" />
                    <div className="h-7 w-7 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-[#f97316] to-[#5A4FFF]" />
                    <div className="h-7 w-7 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-[#22c55e] to-[#0ea5e9]" />
                  </div>
                  <p>Early beta with CBSE &amp; ICSE students.</p>
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="neo-card relative mx-auto max-w-md overflow-hidden border border-slate-700/70 bg-slate-800/80 p-5">
                <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#5A4FFF]/5 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#00C2A8]/5 blur-3xl" />

                {/* Top bar */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-[#5A4FFF] to-[#00C2A8] p-[2px]">
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-xs font-bold text-[#5A4FFF]">
                        S
                      </div>
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Studyatra dashboard
                      </p>
                      <p className="text-[10px] text-emerald-500 dark:text-emerald-400">
                        Home · Chat · Tests · Timetable
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-50 dark:bg-slate-700 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-300">
                    Class 10 · CBSE
                  </div>
                </div>

                {/* Chat + timetable mini layout */}
                <div className="grid gap-3 sm:grid-cols-[1.1fr_minmax(0,0.95fr)]">
                  {/* Chat bubbles */}
                  <div className="space-y-2">
                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-700/50 px-3 py-2 text-[11px] text-slate-800 dark:text-slate-200 shadow-sm">
                      <p className="font-medium">You</p>
                      <p className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                        &quot;Explain Ohm&apos;s Law in simple words with one
                        real-life example.&quot;
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-tr from-[#5A4FFF]/90 to-[#00C2A8]/90 px-3 py-2 text-[11px] text-indigo-50 shadow-md shadow-indigo-400/50">
                      <p className="font-semibold">Studyatra</p>
                      <p className="mt-0.5 text-[10px] text-indigo-100/90">
                        When you increase the voltage, the current increases in
                        the same ratio (if resistance is constant) — like
                        opening a tap more so more water flows through the same
                        pipe.
                      </p>
                    </div>
                  </div>

                  {/* Right column: quick stats */}
                  <div className="space-y-3">
                    <div className="neo-card-soft relative overflow-hidden border border-slate-200/50 dark:border-slate-700/80 p-3 bg-white dark:bg-slate-800/70">
                      <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-[#5A4FFF]/10 dark:bg-[#5A4FFF]/5" />
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Today&apos;s focus
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Electricity + Linear Equations
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Study streak
                          </p>
                          <p className="text-sm font-semibold text-[#5A4FFF] dark:text-indigo-400">
                            7 days🔥
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            XP this week
                          </p>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            +480 XP
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8]" />
                      </div>
                    </div>

                    <div className="neo-card-soft border border-slate-200/50 dark:border-slate-700/80 p-3 text-[10px] bg-white dark:bg-slate-800/70">
                      <p className="mb-1 font-semibold text-slate-800 dark:text-slate-200">
                        Today&apos;s timetable
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-[9px] font-medium text-[#5A4FFF] dark:text-indigo-400">
                            5:00–5:40 PM
                          </span>
                          <span className="text-[9px] text-slate-600 dark:text-slate-400">
                            Physics · NCERT Ch.12
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                            5:45–6:15 PM
                          </span>
                          <span className="text-[9px] text-slate-600 dark:text-slate-400">
                            Maths · Linear equations quiz
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-[9px] font-medium text-sky-600 dark:text-sky-400">
                            6:20–6:35 PM
                          </span>
                          <span className="text-[9px] text-slate-600 dark:text-slate-400">
                            Revision + XP leaderboard
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Features grid */}
      <section
        id="features"
        className="mx-auto section-max-width px-5 pb-14 pt-10 sm:px-6 lg:px-0 lg:pb-20 lg:pt-14"
      >
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Everything you need for school, in one place.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-700 dark:text-slate-400 sm:text-[0.95rem]">
              From doubt-solving to tests and timetables, Studyatra keeps your
              entire study journey organised — like a digital tuition teacher
              who never gets tired.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
            MADE FOR CBSE · ICSE · STATE BOARDS
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Chat with AI */}
          <FeatureCard
            color="indigo"
            title="Chat with AI"
            description="Ask any doubt from your NCERT, homework, or school notes. Get clear, step-by-step explanations instead of copy-paste answers."
            badge="Core"
          />

          {/* AI-made Notes */}
          <FeatureCard
            color="teal"
            title="AI-made NCERT notes"
            description="Instant, clean notes for any chapter. Highlighted formulas, key points, and exam-focused summaries ready for revision."
            badge="Notes"
          />

          {/* Photo-based solving */}
          <FeatureCard
            color="purple"
            title="Photo-based solving"
            description="Click a photo of a question and watch Studyatra break it down with neat, line-by-line solutions."
            badge="Scan & solve"
          />

          {/* Quizzes & tests */}
          <FeatureCard
            color="sky"
            title="Quizzes & AI tests"
            description="Daily MCQs and one-click chapter tests to practise exactly what you studied today — no random questions."
            badge="Practice"
          />

          {/* Timetable */}
          <FeatureCard
            color="amber"
            title="Smart timetable"
            description="Tell Studyatra your school timings, tuitions, and exam dates. Get a realistic, no-nonsense study plan you can actually follow."
            badge="Planner"
          />

          {/* Weakness + XP */}
          <FeatureCard
            color="emerald"
            title="Weakness & XP tracker"
            description="See which subjects and chapters need more focus, while earning XP and climbing a friendly weekly leaderboard."
            badge="Gamified"
          />
        </div>
      </section>

      {/* Why Studyatra */}
      <section
        id="how-it-works"
        className="mx-auto border-y border-slate-200 bg-white/80 px-5 py-12 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 section-max-width sm:px-6 lg:px-0 lg:py-16"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3 p-9">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                Built specifically for Indian students.
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-400 sm:text-[0.95rem]">
                Studyatra understands NCERT syllabus, board exam patterns, and
                how you actually study after school. Every feature is designed
                to fit your routine — not the other way around.
              </p>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2 pl-9">
              <ValuePoint
                title="NCERT-aligned content"
                text="All explanations, notes, and tests match your NCERT textbooks and board exam format."
              />
              <ValuePoint
                title="Step-by-step learning"
                text="Get hints first, then full solutions — so you understand the process, not just the answer."
              />
              <ValuePoint
                title="Classes 8–12 focused"
                text="Physics, Chemistry, Maths, Biology, and more — tuned for CBSE, ICSE, and state boards."
              />
              <ValuePoint
                title="Progress tracking"
                text="See your strengths, weaknesses, and study streaks — all in one dashboard."
              />
            </div>
          </div>

          {/* “Screenshots” */}
          <div className="grid gap-4 sm:grid-cols-2 pr-9">
            <div className="neo-card-soft flex flex-col justify-between border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/70 dark:shadow-none">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                NCERT-style notes for &quot;Life Processes&quot;
              </p>
              <div className="mt-2 space-y-1.5 text-[10px] text-slate-700 dark:text-slate-400">
                <p>• Key definitions in bold for last-minute revision</p>
                <p>• Diagrams described in text so you can redraw easily</p>
                <p>• Extra exam-style questions with point-wise answers</p>
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-slate-600 dark:text-slate-500">
                <span>Saved in Biology notebook</span>
                <span>Updated just now · Auto-sync</span>
              </div>
            </div>
            <div className="neo-card-soft flex flex-col justify-between border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/70 dark:shadow-none">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                AI-generated chapter test
              </p>
              <div className="mt-2 space-y-1.5 text-[10px] text-slate-700 dark:text-slate-400">
                <p>• 20 MCQs · 5 short questions · 2 long questions</p>
                <p>• Auto-checking with detailed solutions</p>
                <p>• Weakness map created from your mistakes</p>
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-slate-600 dark:text-slate-500">
                <span>Difficulty: Moderate</span>
                <span>Reattempt only wrong questions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="mx-auto px-5 py-12 section-max-width sm:px-6 lg:px-0 lg:py-16"
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            One simple plan. Forever.
          </h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-400 sm:text-[0.95rem]">
            Studyatra access is available as a paid product for ₹300. It is a one time purchase.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          {/* Single paid plan, centered */}
          <div className="w-full max-w-lg neo-card relative border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-[#5A4FFF]/8 via-white to-[#00C2A8]/6 dark:from-[#5A4FFF]/10 dark:via-slate-800 dark:to-[#00C2A8]/8 p-5 ring-1 ring-indigo-200/50 dark:ring-indigo-900/30 shadow-md dark:shadow-none">
            <div className="absolute right-4 top-4 rounded-full bg-[#5A4FFF] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-50 shadow-md shadow-indigo-400/50">
              Recommended
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
              Full access
            </p>
            <p className="mt-2 flex items-baseline gap-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              ₹300
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                one-time
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-400">
              All features unlocked for serious board prep, with progress
              tracking and XP leaderboard. No free trial.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-400">
              <PricingItem text="Unlimited AI chat with subject-wise personas" />
              <PricingItem text="NCERT-aligned notes for all chapters" />
              <PricingItem text="Photo-based solutions with step-wise breakdown" />
              <PricingItem text="Unlimited quizzes and AI-generated tests" />
              <PricingItem text="Personalised timetable + weakness analysis" />
              <PricingItem text="XP, streaks, and weekly leaderboard access" />
              <PricingItem text="Chat history stored for revision anytime" />
            </ul>
            {isSignedIn && isVerified ? (
              <>
                <Link
                  href="/dashboard"
                  className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-[#5A4FFF] py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5]"
                >
                  Go to dashboard
                </Link>
                <p className="mt-5 text-[10px] text-slate-500">
                  Your account is already verified; you have full access to Studyatra.
                </p>
              </>
            ) : (
              <>
                <a
                  href="https://www.thekidcompany.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-[#5A4FFF] py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5]"
                >
                  Buy now for ₹300
                </a>
                <p className="mt-5 text-[10px] text-slate-500">
                  Payment and access are handled on The Kid Company&apos;s website. No free trial is available.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
        <div className="mx-auto flex flex-col gap-4 px-5 py-5 text-xs text-slate-600 dark:text-slate-400 section-max-width sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-100 text-[11px] font-bold text-white dark:text-slate-900">
              S
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                Studyatra
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Made in India for Indian students.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p>© {new Date().getFullYear()} Studyatra. All rights reserved.</p>
            <div className="flex gap-3">
              <Link
                href="/privacy"
                className="hover:text-[#5A4FFF] dark:hover:text-indigo-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-[#5A4FFF] dark:hover:text-indigo-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="hover:text-[#5A4FFF] dark:hover:text-indigo-400 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  badge: string;
  color: "indigo" | "teal" | "purple" | "sky" | "amber" | "emerald";
};

function FeatureCard({ title, description, badge, color }: FeatureCardProps) {
  const colorClasses: Record<FeatureCardProps["color"], string> = {
    indigo:
      "bg-indigo-50 text-[#5A4FFF] ring-indigo-100/80 shadow-indigo-100/80",
    teal: "bg-emerald-50 text-[#00C2A8] ring-emerald-100/80 shadow-emerald-100/80",
    purple:
      "bg-violet-50 text-violet-500 ring-violet-100/80 shadow-violet-100/80",
    sky: "bg-sky-50 text-sky-600 ring-sky-100/80 shadow-sky-100/80",
    amber: "bg-amber-50 text-amber-600 ring-amber-100/80 shadow-amber-100/80",
    emerald:
      "bg-emerald-50 text-emerald-600 ring-emerald-100/80 shadow-emerald-100/80",
  };

  return (
    <div className="neo-card-soft flex h-full flex-col border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 shadow-sm ${colorClasses[color]}`}
        >
          {badge}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

type ValuePointProps = {
  title: string;
  text: string;
};

function ValuePoint({ title, text }: ValuePointProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 text-xs shadow-sm dark:shadow-none">
      <p className="font-semibold text-slate-900 dark:text-slate-200">
        {title}
      </p>
      <p className="mt-1.5 leading-relaxed text-slate-700 dark:text-slate-400">
        {text}
      </p>
    </div>
  );
}

type PricingItemProps = {
  text: string;
};

function PricingItem({ text }: PricingItemProps) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gradient-to-tr from-[#5A4FFF] to-[#00C2A8]" />
      <span>{text}</span>
    </li>
  );
}
