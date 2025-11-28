"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";

type TimeSlot = {
  time: string;
  subject: string;
  type: "study" | "break" | "revision";
};

type Schedule = {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
};

type Timetable = {
  id: number;
  class_value: string;
  board: string;
  name: string;
  schedule: Schedule;
  created_at: string;
  updated_at: string;
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetablePage() {
  const { user, isLoaded } = useUser();
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedBoard, setSelectedBoard] = useState("NCERT");
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [currentTimetable, setCurrentTimetable] = useState<Timetable | null>(null);
  const [isLoadingTimetables, setIsLoadingTimetables] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Generate form state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [timetableName, setTimetableName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Hindi",
    "History",
    "Geography",
    "Civics",
    "Economics",
    "Computer Science",
    "Physical Education",
  ];

  // Load timetables
  const loadTimetables = async () => {
    if (!isLoaded || !user) return;

    setIsLoadingTimetables(true);
    try {
      const params = new URLSearchParams({
        class: selectedClass,
        board: selectedBoard,
      });

      const response = await fetch(`/api/timetable?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load timetables");
      }

      const data = await response.json();
      const loadedTimetables = (data.timetables || []).map((t: any) => ({
        ...t,
        schedule: typeof t.schedule === "string" ? JSON.parse(t.schedule) : t.schedule,
      }));
      setTimetables(loadedTimetables);
      
      // Set first timetable as current if available
      if (loadedTimetables.length > 0 && !currentTimetable) {
        setCurrentTimetable(loadedTimetables[0]);
      } else if (loadedTimetables.length === 0) {
        setCurrentTimetable(null);
      }
    } catch (error) {
      console.error("Error loading timetables:", error);
    } finally {
      setIsLoadingTimetables(false);
    }
  };

  useEffect(() => {
    loadTimetables();
  }, [selectedClass, selectedBoard, isLoaded, user]);

  // Generate AI timetable
  const generateTimetable = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return;
    }

    if (!timetableName.trim()) {
      alert("Please enter a name for the timetable");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/timetable/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjects: selectedSubjects,
          class: selectedClass,
          board: selectedBoard,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate timetable");
      }

      const data = await response.json();
      
      // Save the generated timetable
      const saveResponse = await fetch("/api/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class: selectedClass,
          board: selectedBoard,
          name: timetableName,
          schedule: data.schedule,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save timetable");
      }

      setShowGenerateModal(false);
      setSelectedSubjects([]);
      setTimetableName("");
      loadTimetables();
    } catch (error: any) {
      console.error("Error generating timetable:", error);
      alert(`Failed to generate timetable: ${error?.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete timetable
  const deleteTimetable = async (id: number) => {
    try {
      const response = await fetch(`/api/timetable?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete timetable");
      }

      setShowDeleteConfirm(null);
      if (currentTimetable?.id === id) {
        setCurrentTimetable(null);
      }
      loadTimetables();
    } catch (error: any) {
      console.error("Error deleting timetable:", error);
      alert(`Failed to delete timetable: ${error?.message || "Unknown error"}`);
    }
  };

  // Toggle subject selection
  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  // Get color for slot type
  const getSlotColor = (type: string) => {
    switch (type) {
      case "study":
        return "bg-gradient-to-br from-[#5A4FFF]/20 to-[#5A4FFF]/10 border-[#5A4FFF]/30";
      case "revision":
        return "bg-gradient-to-br from-[#00C2A8]/20 to-[#00C2A8]/10 border-[#00C2A8]/30";
      case "break":
        return "bg-slate-700/30 border-slate-600/30";
      default:
        return "bg-slate-800/50 border-slate-700/30";
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
            <h1 className="text-lg font-semibold text-slate-100">Smart Timetable</h1>
            <div className="flex items-center gap-4">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Filters and Actions */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="mb-2 block text-xs font-medium text-slate-400">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setCurrentTimetable(null);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                >
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mb-2 block text-xs font-medium text-slate-400">Board</label>
                <select
                  value={selectedBoard}
                  onChange={(e) => {
                    setSelectedBoard(e.target.value);
                    setCurrentTimetable(null);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                >
                  <option value="NCERT">NCERT</option>
                  <option value="ICSE">ICSE</option>
                  <option value="STATE Board">STATE Board</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Generate Timetable
                </button>
              </div>
            </div>

            {/* Timetable Selector */}
            {timetables.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-400">Select Timetable:</label>
                <select
                  value={currentTimetable?.id || ""}
                  onChange={(e) => {
                    const selected = timetables.find((t) => t.id === parseInt(e.target.value));
                    setCurrentTimetable(selected || null);
                  }}
                  className="flex-1 max-w-xs rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                >
                  {timetables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {currentTimetable && (
                  <button
                    onClick={() => setShowDeleteConfirm(currentTimetable.id)}
                    className="rounded-lg border border-red-600/50 bg-red-600/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-600/20 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Timetable Display */}
          {isLoadingTimetables ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#5A4FFF] border-t-transparent"></div>
                <p className="text-sm text-slate-400">Loading timetables...</p>
              </div>
            </div>
          ) : !currentTimetable ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-200">No timetable found</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Generate your first AI-powered timetable to get started
                </p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="mt-4 rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all"
                >
                  Generate Timetable
                </button>
              </div>
            </div>
          ) : (
            <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">{currentTimetable.name}</h2>
                <span className="rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-400">
                  {currentTimetable.class_value} • {currentTimetable.board}
                </span>
              </div>

              {/* Weekly Grid */}
              <div className="overflow-x-auto">
                <div className="grid min-w-[800px] grid-cols-7 gap-3">
                  {DAYS.map((day, dayIndex) => (
                    <div key={day} className="flex flex-col">
                      <div className="mb-2 text-center text-sm font-semibold text-slate-300">
                        {DAY_LABELS[dayIndex]}
                      </div>
                      <div className="space-y-2">
                        {currentTimetable.schedule[day]?.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className={`rounded-lg border p-2 text-xs ${getSlotColor(slot.type)}`}
                          >
                            <div className="font-medium text-slate-300">{slot.time}</div>
                            <div className="mt-1 text-slate-200">{slot.subject}</div>
                            {slot.type !== "break" && (
                              <div className="mt-1 text-[10px] text-slate-400 capitalize">
                                {slot.type}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate Modal */}
          {showGenerateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 max-h-[90vh] overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-100">Generate AI Timetable</h2>
                  <button
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedSubjects([]);
                      setTimetableName("");
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Timetable Name *
                    </label>
                    <input
                      type="text"
                      value={timetableName}
                      onChange={(e) => setTimetableName(e.target.value)}
                      placeholder="e.g., Weekly Study Plan, Exam Preparation..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Select Subjects * (Select at least one)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {subjects.map((subject) => (
                        <button
                          key={subject}
                          onClick={() => toggleSubject(subject)}
                          className={`rounded-lg border p-3 text-left text-sm transition-all ${
                            selectedSubjects.includes(subject)
                              ? "border-[#5A4FFF] bg-[#5A4FFF]/20 text-[#5A4FFF]"
                              : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                selectedSubjects.includes(subject)
                                  ? "border-[#5A4FFF] bg-[#5A4FFF]"
                                  : "border-slate-600"
                              }`}
                            >
                              {selectedSubjects.includes(subject) && (
                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span>{subject}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedSubjects.length > 0 && (
                      <p className="mt-2 text-xs text-slate-400">
                        {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowGenerateModal(false);
                        setSelectedSubjects([]);
                        setTimetableName("");
                      }}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateTimetable}
                      disabled={selectedSubjects.length === 0 || !timetableName.trim() || isGenerating}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generating...
                        </span>
                      ) : (
                        "Generate Timetable"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-100">Delete Timetable</h3>
                <p className="mb-6 text-sm text-slate-400">
                  Are you sure you want to delete this timetable? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteTimetable(showDeleteConfirm)}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
