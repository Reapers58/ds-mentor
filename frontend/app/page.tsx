"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { Typewriter } from "@/components/typewriter";
import { IsometricGrid } from "@/components/isometric-grid";
import { PanelRightOpen, PanelRightClose, Calendar, CheckSquare, Clock, Bell } from "lucide-react";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: { filename: string; score: number; content_preview: string }[];
}

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
}

interface Dashboard {
  date: string;
  greeting: string;
  calendar_events: { time: string; title: string; duration_min: number; event_type: string }[];
  pending_tasks: { id: string; title: string; due: string | null; priority: string; completed: boolean }[];
  timesheet_status: string;
  reminders: string[];
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadConversations();
    loadDashboard();
    const convParam = new URLSearchParams(window.location.search).get("conv");
    if (convParam) {
      selectConv(convParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id) selectConv(id);
    };
    window.addEventListener("open-conversation", onOpen);
    return () => window.removeEventListener("open-conversation", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onReset = () => newChat();
    window.addEventListener("reset-chat", onReset);
    return () => window.removeEventListener("reset-chat", onReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch {
      // silent
    }
  };

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch {
      // silent
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await api.getMessages(convId);
      setMessages(
        data.map((m: { id: string; role: string; content: string; sources?: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          sources: m.sources ? JSON.parse(m.sources) : undefined,
        }))
      );
    } catch {
      // silent
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const query = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: query }]);

    try {
      const data = await api.chat(query, activeConv || undefined);
      setActiveConv(data.conversation_id);

      const sources =
        data.sources?.map((s: { filename: string; score: number; content_preview: string }) => ({
          filename: s.filename,
          score: s.score,
          content_preview: s.content_preview,
        })) || [];

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          sources,
        },
      ]);

      if (data.title) {
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === data.conversation_id);
          if (exists) {
            return prev.map((c) =>
              c.id === data.conversation_id ? { ...c, title: data.title } : c
            );
          }
          return [
            {
              id: data.conversation_id,
              title: data.title,
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      } else {
        loadConversations();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeConv]);

  const newChat = () => {
    setActiveConv(null);
    setMessages([]);
  };

  const selectConv = (convId: string) => {
    setActiveConv(convId);
    loadMessages(convId);
  };

  const deleteConv = async (convId: string) => {
    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConv === convId) {
        setActiveConv(null);
        setMessages([]);
      }
    } catch {
      // silent
    }
  };

  const priorityColor = (p: string) => {
    if (p === "high") return "text-red-400";
    if (p === "medium") return "text-yellow-400";
    return "text-green-400";
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent-orange animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-background">
      {/* Sidebar - fixed overlay */}
      <div className="fixed inset-y-0 left-0 z-30">
        <Sidebar
          conversations={conversations}
          activeConvId={activeConv}
          onSelectConversation={selectConv}
          onNewChat={newChat}
          onDeleteConversation={deleteConv}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="h-full flex flex-col">
        <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? "pl-16" : "pl-64"} transition-all duration-300`}>
          {messages.length === 0 && !loading ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Hello, {user?.full_name?.split(" ")[0] || "there"}
                </h1>
                <div className="h-7 text-lg text-zinc-400">
                  <Typewriter
                    strings={[
                      "Ask me about company SOPs",
                      "How do I onboard a new hire?",
                      "What's our deployment process?",
                      "Guide me through code review",
                    ]}
                    typingSpeed={50}
                    deletingSpeed={25}
                    pauseDuration={3000}
                  />
                </div>
              </div>

              <IsometricGrid />

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-xl">
                {[
                  "What's the onboarding process?",
                  "How do I submit a timesheet?",
                  "Deployment checklist",
                  "Code review guidelines",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="px-4 py-2 rounded-full text-sm text-zinc-400 border border-glass-border bg-glass-bg hover:bg-glass-hover hover:text-white hover:border-accent-orange/30 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="py-4">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                />
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="py-4 px-4 md:px-0">
                  <div className="max-w-3xl mx-auto">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      DS-Mentor
                    </div>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={sendMessage}
          disabled={loading}
        />
      </div>

      {/* Toggle Panel Button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-surface border border-glass-border hover:bg-glass-hover transition-colors"
        title={panelOpen ? "Hide panel" : "Show Your Day"}
      >
        {panelOpen ? (
          <PanelRightClose className="w-5 h-5 text-zinc-400" />
        ) : (
          <PanelRightOpen className="w-5 h-5 text-zinc-400" />
        )}
      </button>

      {/* Your Day Panel (slide-in) */}
        <div
          className={`fixed top-0 right-0 h-full w-72 bg-glass-bg backdrop-blur-glass shadow-glass border-l border-glass-border overflow-y-auto transition-transform duration-300 z-10 ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
        <div className="p-4 pt-14">
          <h3 className="text-sm font-semibold text-white mb-1">Your Day</h3>
          <p className="text-xs text-zinc-500 mb-4">{dashboard?.date || "Loading..."}</p>
          <p className="text-sm text-zinc-300 mb-4">{dashboard?.greeting}</p>

          {/* Schedule */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-accent-orange" />
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Schedule</h4>
            </div>
            {dashboard?.calendar_events.map((e, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 text-sm">
                <span className="text-xs text-zinc-500 w-10 flex-shrink-0">{e.time}</span>
                <span className="text-zinc-300">{e.title}</span>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-accent-orange" />
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tasks</h4>
            </div>
            {dashboard?.pending_tasks.map((t, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 text-sm">
                <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 mt-0.5 ${
                  t.completed ? "bg-accent-orange border-accent-orange" : "border-zinc-600"
                }`} />
                <div>
                  <span className={`block ${priorityColor(t.priority)}`}>{t.title}</span>
                  {t.due && (
                    <span className="text-xs text-zinc-600">Due: {t.due}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timesheet */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-accent-orange" />
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Timesheet</h4>
            </div>
            <div className="px-3 py-2 rounded-lg bg-background text-sm text-zinc-300">
              {dashboard?.timesheet_status}
            </div>
          </div>

          {/* Reminders */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-3.5 h-3.5 text-accent-orange" />
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reminders</h4>
            </div>
            {dashboard?.reminders.map((r, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-orange flex-shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
