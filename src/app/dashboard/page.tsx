"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "./components/Sidebar";
import ChatHistorySidebar, { ChatSession } from "./components/ChatHistorySidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: Date;
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedBoard, setSelectedBoard] = useState("NCERT");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const isLoadingSessionRef = useRef(false);
  const justLoadedMessagesRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Generate a new session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save sessions to database
  const saveSessionsToDatabase = async (sessions: ChatSession[]) => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class: selectedClass,
          board: selectedBoard,
          sessions: sessions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Failed to save sessions (${response.status})`);
      }
    } catch (error: any) {
      console.error("Error saving sessions to database:", error);
      // Don't show alert for every save failure to avoid spam
      // Only log it for debugging
    }
  };

  // Load chat sessions from database
  const loadChatSessions = async () => {
    if (!isLoaded || !user) {
      console.log("Waiting for user to load...", { isLoaded, user: !!user });
      return;
    }
    
    setIsLoadingSessions(true);
    try {
      const url = `/api/chat/sessions?class=${selectedClass}&board=${selectedBoard}`;
      console.log("Loading sessions from:", url);
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to load sessions:", response.status, errorData);
        throw new Error(errorData.error || "Failed to load sessions");
      }

      const data = await response.json();
      console.log("Sessions loaded:", data.sessions?.length || 0, "sessions");
      
      // Convert timestamp strings to Date objects
      const sessions = (data.sessions || []).map((session: any) => ({
        ...session,
        timestamp: session.timestamp ? new Date(session.timestamp) : new Date(),
      }));

      setChatSessions(sessions);

      if (sessions.length > 0) {
        // Load the most recent session
        const mostRecent = sessions.sort((a: ChatSession, b: ChatSession) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          return timeB - timeA;
        })[0];
        console.log("Loading most recent session:", mostRecent.id);
        setCurrentSessionId(mostRecent.id);
        await loadSession(mostRecent.id);
      } else {
        console.log("No sessions found, creating new one");
        // No sessions, create new one
        await createNewSession();
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
      // Don't create a new session on error, just show empty state
      setChatSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load a specific session from database
  const loadSession = async (sessionId: string) => {
    if (!sessionId) {
      console.log("No sessionId provided to loadSession");
      setIsLoading(false);
      return;
    }
    
    try {
      isLoadingSessionRef.current = true;
      setIsLoadingSession(true);
      setIsLoading(true);
      console.log("Loading session messages for:", sessionId);
      
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to load session:", response.status, errorData);
        throw new Error(errorData.error || "Failed to load session");
      }

      const data = await response.json();
      console.log("Messages loaded from API - raw data:", data);
      console.log("Messages loaded from API:", data.messages?.length || 0, "messages");
      
      if (!data.messages || !Array.isArray(data.messages)) {
        console.warn("Invalid messages data received:", data);
        setMessages([]);
        setIsLoading(false);
        isLoadingSessionRef.current = false;
        setIsLoadingSession(false);
        return;
      }
      
      const messages = data.messages.map((msg: any, index: number) => {
        const processed = {
          id: msg.id?.toString() || `msg_${Date.now()}_${index}`,
          role: msg.role || "user",
          content: msg.content || "",
          imageUrl: msg.imageUrl || undefined,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        };
        console.log(`Message ${index}:`, processed);
        return processed;
      });
      
      console.log("Processed messages:", messages.length, messages);
      
      // Small delay to ensure state is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Mark that we're loading messages from database
      justLoadedMessagesRef.current = true;
      setMessages(messages);
      console.log("Messages set in state - final count:", messages.length);
      console.log("Current messages state after set:", messages);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    } catch (error) {
      console.error("Error loading session:", error);
      setMessages([]);
      // Show error to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Failed to load messages. Please try again.`,
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
      // Clear loading flags after a short delay to ensure state updates are complete
      setTimeout(() => {
        isLoadingSessionRef.current = false;
        setIsLoadingSession(false);
        // Clear the just-loaded flag after a bit more time to allow save effect to skip
        setTimeout(() => {
          justLoadedMessagesRef.current = false;
        }, 200);
      }, 100);
    }
  };

  // Create a new chat session
  const createNewSession = async () => {
    try {
      const newSessionId = generateSessionId();
      console.log("Creating new session:", newSessionId);
      
      const newSession: ChatSession = {
        id: newSessionId,
        title: "New Chat",
        lastMessage: "",
        timestamp: new Date(),
        messageCount: 0,
      };
      
      // Clear the just-loaded flag since we're creating a new session
      justLoadedMessagesRef.current = false;
      setCurrentSessionId(newSessionId);
      setMessages([]);
      console.log("New session set as current:", newSessionId);
      
      // Add to sessions list
      const updatedSessions = [newSession, ...chatSessions];
      setChatSessions(updatedSessions);
      
      // Save to database
      await saveSessionsToDatabase(updatedSessions);
      console.log("New session saved to database");
    } catch (error) {
      console.error("Error creating new session:", error);
    }
  };

  // Delete a session from database
  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/chat/sessions?class=${selectedClass}&board=${selectedBoard}&sessionId=${sessionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Failed to delete session (${response.status})`);
      }

      // Remove from sessions list
      const updatedSessions = chatSessions.filter((s) => s.id !== sessionId);
      setChatSessions(updatedSessions);
      
      // If deleted session was current, create new one
      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          const mostRecent = updatedSessions.sort((a, b) => {
            const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
            const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
            return timeB - timeA;
          })[0];
          setCurrentSessionId(mostRecent.id);
          await loadSession(mostRecent.id);
        } else {
          await createNewSession();
        }
      }
    } catch (error: any) {
      console.error("Error deleting session:", error);
      alert(`Failed to delete session: ${error?.message || "Unknown error"}`);
    }
  };

  // Select a session
  const selectSession = async (sessionId: string) => {
    if (currentSessionId === sessionId) {
      // Already selected, just scroll to bottom
      scrollToBottom();
      return;
    }
    
    console.log("Selecting session:", sessionId);
    
    // Set loading flag first to prevent save effect from running
    isLoadingSessionRef.current = true;
    setIsLoadingSession(true);
    setCurrentSessionId(sessionId);
    setMessages([]); // Clear current messages while loading
    setIsLoading(true); // Show loading state
    
    try {
      await loadSession(sessionId);
    } catch (error) {
      console.error("Error selecting session:", error);
      setIsLoading(false);
      isLoadingSessionRef.current = false;
      setIsLoadingSession(false);
    }
  };


  // Load sessions when class/board changes or on mount
  useEffect(() => {
    if (!isLoaded || !user) return;
    loadChatSessions();
  }, [selectedClass, selectedBoard, isLoaded, user]);

  // Save current session messages to database whenever they change
  useEffect(() => {
    console.log("Save effect triggered:", {
      isLoaded,
      hasUser: !!user,
      currentSessionId,
      isLoadingSession: isLoadingSessionRef.current || isLoadingSession,
      messagesCount: messages.length,
    });
    
    if (!isLoaded || !user || !currentSessionId) {
      console.log("Save effect skipped - missing requirements");
      return;
    }
    
    // Don't save if we're currently loading a session (to prevent overwriting loaded messages)
    if (isLoadingSessionRef.current || isLoadingSession) {
      console.log("Save effect skipped - currently loading session");
      return;
    }
    
    // Don't save if messages were just loaded from database (to avoid redundant saves)
    if (justLoadedMessagesRef.current) {
      console.log("Save effect skipped - messages just loaded from database");
      return;
    }
    
    // Don't save if messages are empty and we just switched sessions
    if (messages.length === 0) {
      console.log("Save effect skipped - no messages");
      return;
    }
    
    const saveMessages = async () => {
      try {
        console.log("Saving messages to database:", {
          sessionId: currentSessionId,
          messageCount: messages.length,
          messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content?.substring(0, 30) })),
        });
        
        // Serialize messages properly (convert Date objects to ISO strings)
        const messagesToSave = messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          imageUrl: msg.imageUrl,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
        }));
        
        // Save messages to database
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            messages: messagesToSave,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to save messages:", response.status, errorData);
          throw new Error(errorData.error || "Failed to save messages");
        }

        const result = await response.json();
        console.log("Messages saved successfully:", result);

        // Update session metadata
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const title = messages[0]?.content?.substring(0, 50) || "New Chat";
          
          // Update sessions state
          setChatSessions((prevSessions) => {
            const updatedSessions = prevSessions.map((session) =>
              session.id === currentSessionId
                ? {
                    ...session,
                    title: title.length < 50 ? title : title + "...",
                    lastMessage: lastMessage.content.substring(0, 100),
                    timestamp: new Date(),
                    messageCount: messages.length,
                  }
                : session
            );
            
            // Save updated sessions to database (async, don't await)
            saveSessionsToDatabase(updatedSessions).catch(console.error);
            
            return updatedSessions;
          });
        }
      } catch (error) {
        console.error("Error saving session:", error);
      }
    };

    // Debounce saves to avoid too many API calls
    const timeoutId = setTimeout(() => {
      saveMessages();
    }, 500);

    return () => {
      console.log("Clearing save timeout");
      clearTimeout(timeoutId);
    };
  }, [messages, currentSessionId, isLoaded, user, selectedClass, selectedBoard, isLoadingSession]);
  
  // Function to clear current chat
  const clearChatHistory = () => {
    if (currentSessionId) {
      deleteSession(currentSessionId);
      createNewSession();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (file: File | null) => {
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageSelect(file);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

    // Clear the just-loaded flag when user sends a message (messages are being modified)
    justLoadedMessagesRef.current = false;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim() || "Solve this question from the image",
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Remove image after sending
    const imageToSend = selectedImage;
    const imagePreviewToSend = imagePreview;
    removeImage();

    try {
      let response;
      
      if (imageToSend) {
        // Photo-based question solving
        const formData = new FormData();
        formData.append("image", imageToSend);
        formData.append("class", selectedClass);
        formData.append("board", selectedBoard);
        if (inputMessage.trim()) {
          formData.append("question", inputMessage.trim());
        }

        const res = await fetch("/api/solve-question", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `Failed to solve question (${res.status})`);
        }
        response = await res.json();
      } else {
        // Regular chat
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            class: selectedClass,
            board: selectedBoard,
            conversationHistory: messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `Failed to get response (${res.status})`);
        }
        response = await res.json();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message || response.solution || "I apologize, but I couldn't process your request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error?.message || "Unknown error"}. Please check your OpenAI API key configuration and try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
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

      {/* Main Content Area */}
      <div className="lg:pl-64 lg:pr-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="mx-auto flex w-full items-center justify-between px-5 py-4 section-max-width sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-slate-100">Chat with AI</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-xs text-slate-400">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
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

        {/* Main Content */}
        <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Get explanations, answers, and homework help tailored to your curriculum
          </p>
          {messages.length > 0 && (
            <button
              onClick={clearChatHistory}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-slate-200 transition-colors"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Class and Board Selectors */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Class
            </label>
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
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Board
            </label>
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
        </div>

        {/* Chat Container */}
        <div className="neo-card border border-slate-700/70 bg-slate-800/80 p-6">
          {/* Messages Area */}
          <div className="mb-6 h-[500px] overflow-y-auto space-y-4 pr-2">
            {(() => {
              console.log("Rendering messages area - messages count:", messages.length);
              console.log("Rendering messages area - messages:", messages);
              return null;
            })()}
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#5A4FFF] to-[#00C2A8]">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-300">
                    Start a conversation
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ask any question or upload a photo of a problem
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#5A4FFF] to-[#00C2A8]">
                      <span className="text-xs font-bold text-white">S</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-tr from-[#5A4FFF]/90 to-[#00C2A8]/90 text-white"
                        : "bg-slate-700/50 text-slate-100"
                    }`}
                  >
                    {message.imageUrl && (
                      <div className="mb-2">
                        <img
                          src={message.imageUrl}
                          alt="Question"
                          className="max-w-full rounded-lg"
                        />
                      </div>
                    )}
                    {message.role === "assistant" ? (
                      <div className="chat-markdown text-sm leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] opacity-70">
                      {message.timestamp instanceof Date
                        ? message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700">
                      <span className="text-xs font-bold text-slate-300">
                        {user?.firstName?.[0] || "U"}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#5A4FFF] to-[#00C2A8]">
                  <span className="text-xs font-bold text-white">S</span>
                </div>
                <div className="rounded-2xl bg-slate-700/50 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <div className="relative rounded-lg border border-slate-700 p-2 bg-slate-900/50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-3">
            {/* Camera/Upload Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCameraClick}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:border-[#5A4FFF]/50 hover:text-[#5A4FFF] transition-colors"
                title="Take a photo"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={handleUploadClick}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:border-[#5A4FFF]/50 hover:text-[#5A4FFF] transition-colors"
                title="Upload an image"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Text Input */}
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder={
                  selectedImage
                    ? "Add a question or description (optional)..."
                    : "Ask a question or describe what you need help with..."
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 ring-1 ring-slate-700/50 transition-all focus:border-[#5A4FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#5A4FFF]/20 resize-none overflow-y-auto"
                rows={1}
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5A4FFF] text-white shadow-lg shadow-indigo-400/40 hover:bg-[#4A3DF5] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </main>
      </div>

      {/* Right Sidebar - Chat History */}
      <ChatHistorySidebar
        sessions={chatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={isHistorySidebarOpen}
        onToggle={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
      />
    </div>
  );
}
