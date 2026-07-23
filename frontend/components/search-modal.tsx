"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Search, X, MessageSquare, CornerDownRight } from "lucide-react";

interface SearchResult {
  conversation_id: string;
  conversation_title: string | null;
  message_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.searchMessages(query.trim());
        setResults(data as SearchResult[]);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  const handleSelect = (convId: string) => {
    onClose();
    if (window.location.pathname === "/") {
      window.dispatchEvent(new CustomEvent("open-conversation", { detail: convId }));
    } else {
      router.push(`/?conv=${convId}`);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-surface border border-glass-border rounded-2xl shadow-glass overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
          <Search className="w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your chats..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-accent-orange rounded-full animate-spin" />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-glass-hover transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {!searched && !loading && (
            <p className="text-sm text-zinc-500 text-center py-8">
              Type to search through all your conversations
            </p>
          )}

          {searched && results.length === 0 && !loading && (
            <p className="text-sm text-zinc-500 text-center py-8">
              No messages found for &ldquo;{query}&rdquo;
            </p>
          )}

          {results.map((r) => (
            <button
              key={r.message_id}
              onClick={() => handleSelect(r.conversation_id)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-glass-hover transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-accent-orange flex-shrink-0" />
                <span className="text-sm font-medium text-white truncate">
                  {r.conversation_title || "New Conversation"}
                </span>
                <span
                  className={`text-[10px] uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                    r.role === "user"
                      ? "bg-accent-orange/15 text-accent-orange"
                      : "bg-accent-blue/15 text-accent-blue"
                  }`}
                >
                  {r.role}
                </span>
                <CornerDownRight className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2 pl-5.5">
                {r.content.replace(/\n+/g, " ")}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-glass-border">
          <p className="text-[11px] text-zinc-600">
            Press <kbd className="px-1 py-0.5 rounded bg-glass-bg border border-glass-border">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
