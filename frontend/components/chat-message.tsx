"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface Source {
  filename: string;
  score: number;
  content_preview: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export function ChatMessage({ role, content, sources }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, x: isUser ? 18 : -18 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "flex px-6 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("w-full", isUser ? "max-w-md" : "max-w-2xl")}>
        <div
          className={cn(
            "px-4 py-3 text-[15px] leading-relaxed border backdrop-blur-glass",
            isUser
              ? "bg-accent-orange/15 border-accent-orange/25 text-zinc-100 rounded-2xl rounded-br-md"
              : "bg-glass-bg border-glass-border text-zinc-200 rounded-2xl rounded-bl-md"
          )}
        >
          <div
            className={cn(
              "mb-1.5 text-[11px] font-semibold uppercase tracking-wider",
              isUser ? "text-accent-orange" : "text-zinc-500"
            )}
          >
            {isUser ? "You" : "DS-Mentor"}
          </div>
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0">{children}</p>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-5 mb-3 space-y-1.5">
                      {children}
                    </ol>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside pl-5 mb-3 space-y-1.5">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed [&>p]:my-0">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-zinc-300">{children}</em>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold text-white mb-1.5 mt-3 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold text-white mb-1.5 mt-2.5 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold text-white mb-1 mt-2 first:mt-0">{children}</h3>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-accent-orange text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className={className}>{children}</code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="p-3 rounded-lg bg-zinc-900/80 border border-glass-border overflow-x-auto mb-3 text-sm font-mono text-zinc-300">
                      {children}
                    </pre>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-blue hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-accent-orange/40 pl-3 mb-3 text-zinc-400 italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-glass-border my-4" />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
          {!isUser && sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-glass-border">
              <div className="flex flex-wrap gap-2">
                {sources.map((source, i) => (
                  <Badge key={i} variant="default" className="text-xs">
                    {source.filename} ({(source.score * 100).toFixed(0)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
