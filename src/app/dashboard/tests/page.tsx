"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";
import { UserButton } from "@clerk/nextjs";
import { syllabusKnowledge } from "@/app/api/chat/syllabus";

type Question = {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
};

export default function TestsPage() {
  const { user, isLoaded } = useUser();
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedBoard, setSelectedBoard] = useState("NCERT");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [testType, setTestType] = useState<"test" | "quiz">("quiz");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  const getSubjects = () => {
    const classSyllabus = syllabusKnowledge[selectedClass as keyof typeof syllabusKnowledge];
    if (!classSyllabus) return [];
    const boardSyllabus = classSyllabus[selectedBoard as keyof typeof classSyllabus];
    if (!boardSyllabus || typeof boardSyllabus !== 'object' || !('subjects' in boardSyllabus)) return [];
    return (boardSyllabus as any).subjects || [];
  };

  const getTopics = () => {
    const classSyllabus = syllabusKnowledge[selectedClass as keyof typeof syllabusKnowledge];
    if (!classSyllabus) return [];
    const boardSyllabus = classSyllabus[selectedBoard as keyof typeof classSyllabus];
    if (!boardSyllabus || typeof boardSyllabus !== 'object') return [];
    
    const normalizedSubjectMap: Record<string, string> = {
      mathematics: "math",
      maths: "math",
      math: "math",
      science: "science",
      physics: "physics",
      chemistry: "chemistry",
      biology: "biology",
    };
    const subjectKey = selectedSubject.trim().toLowerCase().replace(/\s+/g, "");
    const normalizedKey = normalizedSubjectMap[subjectKey] || subjectKey;

    if (
      normalizedKey in boardSyllabus &&
      Array.isArray((boardSyllabus as Record<string, unknown>)[normalizedKey])
    ) {
      return (boardSyllabus as Record<string, string[]>)[normalizedKey] || [];
    }
    return [];
  };

  const generateQuestions = async () => {
    if (!selectedSubject) {
      alert("Please select a subject!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classValue: selectedClass,
          board: selectedBoard,
          subject: selectedSubject,
          topic: selectedTopic || null,
          testType,
          numQuestions: testType === 'quiz' ? 10 : 20,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setCurrentQ(0);
      setAnswers(new Array(data.questions.length).fill(-1));
      setScore(0);
      setStartTime(Date.now());
      setTestStarted(true);
      setTestCompleted(false);
    } catch (error: any) {
      alert(error.message || 'Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitTest();
    }
  };

  const handlePrevious = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  const submitTest = async () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correct) {
        correct++;
      }
    });

    const finalScore = Math.round((correct / questions.length) * 100);
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    setScore(finalScore);
    setTestCompleted(true);

    try {
      await fetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classValue: selectedClass,
          board: selectedBoard,
          subject: selectedSubject,
          topic: selectedTopic || null,
          testType,
          totalQuestions: questions.length,
          correctAnswers: correct,
          timeTaken,
        }),
      });
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  const resetTest = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setQuestions([]);
    setCurrentQ(0);
    setAnswers([]);
    setScore(0);
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

  if (testCompleted) {
    const correct = answers.filter((a, i) => a === questions[i].correct).length;
    const xpEarned = Math.round(score * (testType === 'test' ? 2 : 1));
    const pointsEarned = score; // Points that count towards leaderboard

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="mx-auto flex w-full items-center justify-between px-5 py-4 section-max-width sm:px-6 lg:px-8">
              <h1 className="text-lg font-semibold text-slate-100">Tests & Quizzes</h1>
              <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
            </div>
          </header>
          <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Test Completed!</h2>
              <p className="text-slate-400 mb-4">
                You scored {correct} out of {questions.length} questions
              </p>
              <div className="text-4xl font-bold text-[#5A4FFF] mb-2">{score}%</div>
              <div className="text-lg text-green-400 mb-2">+{xpEarned} XP Earned! ⭐</div>
              <div className="text-sm text-slate-400 mb-6">
                You earned <span className="text-[#5A4FFF] font-bold">{pointsEarned} points</span> that count towards the leaderboard!
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetTest}
                  className="rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-6 py-2.5 text-sm font-semibold text-white"
                >
                  Take Another Test
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (testStarted && questions.length > 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="mx-auto flex w-full items-center justify-between px-5 py-4 section-max-width sm:px-6 lg:px-8">
              <h1 className="text-lg font-semibold text-slate-100">
                {testType === 'quiz' ? 'Quiz' : 'Test'} - {selectedSubject}
              </h1>
              <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
            </div>
          </header>
          <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Question {currentQ + 1} of {questions.length}
                </div>
                <div className="text-sm text-slate-400">
                  Progress: {Math.round(((currentQ + 1) / questions.length) * 100)}%
                </div>
              </div>
              <div className="mb-6 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] transition-all"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>
              <h2 className="text-xl font-semibold mb-6">{questions[currentQ].question}</h2>
              <div className="space-y-3 mb-6">
                {questions[currentQ].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                      answers[currentQ] === i
                        ? "border-[#5A4FFF] bg-[#5A4FFF]/20 shadow-lg shadow-[#5A4FFF]/20"
                        : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQ] === i
                          ? "border-[#5A4FFF] bg-[#5A4FFF]/20"
                          : "border-slate-500"
                      }`}>
                        {answers[currentQ] === i && (
                          <div className="w-3 h-3 rounded-full bg-[#5A4FFF]"></div>
                        )}
                      </div>
                      <span>{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentQ === 0}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-4 py-2 font-semibold"
                >
                  {currentQ === questions.length - 1 ? "Submit" : "Next"}
                </button>
              </div>
            </div>
          </main>
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
            <h1 className="text-lg font-semibold text-slate-100">Tests & Quizzes</h1>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </div>
        </header>
        <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Create Your Test</h2>
            <p className="text-sm text-slate-400">
              Select your class, board, subject, and topic. AI will generate questions for you!
            </p>
          </div>

          <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSubject("");
                    setSelectedTopic("");
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100"
                >
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">Board</label>
                <select
                  value={selectedBoard}
                  onChange={(e) => {
                    setSelectedBoard(e.target.value);
                    setSelectedSubject("");
                    setSelectedTopic("");
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100"
                >
                  <option value="NCERT">NCERT</option>
                  <option value="ICSE">ICSE</option>
                  <option value="STATE Board">STATE Board</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedTopic("");
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100"
                >
                  <option value="">Select Subject</option>
                  {getSubjects().map((subject: string) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">Topic (Optional)</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100"
                  disabled={!selectedSubject}
                >
                  <option value="">All Topics</option>
                  {getTopics().map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-xs font-medium text-slate-400">Test Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setTestType("quiz")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 transition-all ${
                    testType === "quiz"
                      ? "border-[#5A4FFF] bg-[#5A4FFF]/20"
                      : "border-slate-600"
                  }`}
                >
                  <div className="font-semibold">Quiz</div>
                  <div className="text-xs text-slate-400">10 questions</div>
                </button>
                <button
                  onClick={() => setTestType("test")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 transition-all ${
                    testType === "test"
                      ? "border-[#5A4FFF] bg-[#5A4FFF]/20"
                      : "border-slate-600"
                  }`}
                >
                  <div className="font-semibold">Test</div>
                  <div className="text-xs text-slate-400">20 questions</div>
                </button>
              </div>
            </div>

            <button
              onClick={generateQuestions}
              disabled={loading || !selectedSubject}
              className="w-full rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Questions with AI...
                </span>
              ) : (
                `Generate ${testType === 'quiz' ? 'Quiz' : 'Test'} with AI`
              )}
            </button>
            {selectedTopic && (
              <p className="mt-3 text-xs text-slate-400 text-center">
                Questions will focus on: <span className="text-[#5A4FFF] font-semibold">{selectedTopic}</span>
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
