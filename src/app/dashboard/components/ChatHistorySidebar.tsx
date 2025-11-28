"use client";

import { useState } from "react";

export type ChatSession = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
};

type ChatHistorySidebarProps = {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
};

export default function ChatHistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggle,
}: ChatHistorySidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  return (
    <>
      {/* Toggle button for mobile */}
      <button
        onClick={onToggle}
        className="fixed right-4 top-4 z-50 rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-300 lg:hidden"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 z-40 h-screen w-64 border-l border-slate-800 bg-slate-900/95 backdrop-blur-sm transition-transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">Chat History</h2>
              <button
                onClick={onToggle}
                className="lg:hidden rounded-lg p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={onNewChat}
              className="w-full rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/20 hover:from-[#4A3DF5] hover:to-[#00B89A] transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </span>
            </button>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center px-4">
                  <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs text-slate-500">No past chats yet</p>
                  <p className="text-xs text-slate-600 mt-1">Start a new conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onMouseEnter={() => setHoveredSession(session.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? "bg-gradient-to-r from-[#5A4FFF]/20 to-[#00C2A8]/10 border border-[#5A4FFF]/30"
                        : "hover:bg-slate-800/50"
                    }`}
                    onClick={() => onSelectSession(session.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-slate-200 truncate mb-1">
                          {session.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-1">
                          {session.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{session.messageCount} messages</span>
                          <span>•</span>
                          <span>
                            {new Date(session.timestamp).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      {hoveredSession === session.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete chat"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
