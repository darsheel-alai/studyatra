"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";

type Note = {
  id: number;
  class_value: string;
  board: string;
  subject: string | null;
  topic: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function NotesPage() {
  const { user, isLoaded } = useUser();
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedBoard, setSelectedBoard] = useState("NCERT");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Form state
  const [formTopic, setFormTopic] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load notes
  const loadNotes = async () => {
    if (!isLoaded || !user) return;

    setIsLoadingNotes(true);
    try {
      const params = new URLSearchParams({
        class: selectedClass,
        board: selectedBoard,
      });
      if (selectedSubject) params.append("subject", selectedSubject);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/notes?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load notes");
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedClass, selectedBoard, selectedSubject, searchQuery, isLoaded, user]);

  // Generate AI notes
  const generateNotes = async () => {
    if (!formTopic.trim()) {
      alert("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/notes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: formTopic,
          subject: formSubject || null,
          class: selectedClass,
          board: selectedBoard,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate notes");
      }

      const data = await response.json();
      setFormContent(data.content);
    } catch (error: any) {
      console.error("Error generating notes:", error);
      alert(`Failed to generate notes: ${error?.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save note
  const saveNote = async () => {
    if (!formTopic.trim() || !formContent.trim()) {
      alert("Please fill in topic and content");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingNote ? "/api/notes" : "/api/notes";
      const method = editingNote ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingNote
            ? {
                id: editingNote.id,
                topic: formTopic,
                subject: formSubject || null,
                content: formContent,
              }
            : {
                class: selectedClass,
                board: selectedBoard,
                topic: formTopic,
                subject: formSubject || null,
                content: formContent,
              }
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save note");
      }

      // Reset form and close modal
      setFormTopic("");
      setFormSubject("");
      setFormContent("");
      setEditingNote(null);
      setShowCreateModal(false);
      loadNotes();
    } catch (error: any) {
      console.error("Error saving note:", error);
      alert(`Failed to save note: ${error?.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const deleteNote = async (id: number) => {
    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete note");
      }

      setShowDeleteConfirm(null);
      loadNotes();
    } catch (error: any) {
      console.error("Error deleting note:", error);
      alert(`Failed to delete note: ${error?.message || "Unknown error"}`);
    }
  };

  // Open edit modal
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTopic(note.topic);
    setFormSubject(note.subject || "");
    setFormContent(note.content);
    setShowCreateModal(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingNote(null);
    setFormTopic("");
    setFormSubject("");
    setFormContent("");
    setShowCreateModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowCreateModal(false);
    setEditingNote(null);
    setFormTopic("");
    setFormSubject("");
    setFormContent("");
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
    "Other",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="mx-auto flex w-full items-center justify-between px-5 py-4 section-max-width sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-slate-100">AI-Made Notes</h1>
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
                  onChange={(e) => setSelectedClass(e.target.value)}
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
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                >
                  <option value="NCERT">NCERT</option>
                  <option value="ICSE">ICSE</option>
                  <option value="STATE Board">STATE Board</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="mb-2 block text-xs font-medium text-slate-400">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                />
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          {isLoadingNotes ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#5A4FFF] border-t-transparent"></div>
                <p className="text-sm text-slate-400">Loading notes...</p>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-200">No notes found</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {searchQuery || selectedSubject
                    ? "Try adjusting your filters"
                    : "Create your first note to get started"}
                </p>
                {!searchQuery && !selectedSubject && (
                  <button
                    onClick={openCreateModal}
                    className="mt-4 rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all"
                  >
                    Create Note
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="neo-card group relative rounded-xl border border-slate-700/70 bg-slate-800/80 p-6 transition-all hover:border-[#5A4FFF]/50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-slate-100 line-clamp-2">{note.topic}</h3>
                      {note.subject && (
                        <p className="mt-1 text-xs text-slate-400">{note.subject}</p>
                      )}
                    </div>
                    <div className="ml-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEditModal(note)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-[#5A4FFF] transition-colors"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(note.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mb-4 line-clamp-4 text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                    <span className="rounded-full bg-slate-700/50 px-2 py-0.5">
                      {note.class_value} • {note.board}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 max-h-[90vh] overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-100">
                    {editingNote ? "Edit Note" : "Create New Note"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Topic *</label>
                    <input
                      type="text"
                      value={formTopic}
                      onChange={(e) => setFormTopic(e.target.value)}
                      placeholder="e.g., Quadratic Equations, Photosynthesis..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Subject</label>
                    <select
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20"
                    >
                      <option value="">Select Subject (Optional)</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-300">Content *</label>
                      <button
                        onClick={generateNotes}
                        disabled={!formTopic.trim() || isGenerating}
                        className="flex items-center gap-2 rounded-lg border border-[#5A4FFF]/50 bg-[#5A4FFF]/10 px-3 py-1.5 text-xs font-medium text-[#5A4FFF] hover:bg-[#5A4FFF]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate with AI
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Enter note content or generate with AI..."
                      rows={12}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNote}
                      disabled={!formTopic.trim() || !formContent.trim() || isSaving}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : editingNote ? "Update Note" : "Create Note"}
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
                <h3 className="mb-2 text-lg font-semibold text-slate-100">Delete Note</h3>
                <p className="mb-6 text-sm text-slate-400">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteNote(showDeleteConfirm)}
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
