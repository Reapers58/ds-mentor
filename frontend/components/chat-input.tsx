"use client";

import { FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-glass-border bg-glass-bg backdrop-blur-glass p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about SOPs, processes, or best practices..."
          disabled={disabled}
          className={cn(
            "flex-1 h-12 px-4 rounded-xl",
            "bg-background border border-glass-border",
            "text-white placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-accent-orange/50 focus:border-accent-orange/50",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center",
            "bg-accent-orange text-white",
            "hover:bg-accent-orange/90 hover:shadow-glow",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
