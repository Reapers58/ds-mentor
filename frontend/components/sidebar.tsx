"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  FolderOpen,
  Shield,
  LogOut,
  Plus,
  ChevronLeft,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SearchModal } from "@/components/search-modal";

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleHome = () => {
    if (window.location.pathname === "/") {
      window.dispatchEvent(new CustomEvent("reset-chat"));
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-glass-bg backdrop-blur-glass border-r border-glass-border transition-all duration-300 relative overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Orange bloom */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-accent-orange/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-glass-border">
        <Link
          href="/"
          onClick={handleHome}
          className={cn(
            "flex items-center gap-2 hover:opacity-80 transition-opacity",
            collapsed ? "justify-center w-full" : ""
          )}
          title="Home"
        >
          <Image
            src="/logo.png"
            alt="DotSquares"
            width={28}
            height={28}
            className="rounded"
          />
          {!collapsed && (
            <h2 className="text-sm font-semibold text-white truncate">
              DS-Mentor
            </h2>
          )}
        </Link>
        {!collapsed && (
          <div className="flex gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-glass-hover transition-colors"
              title="Search chats"
            >
              <Search className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={onNewChat}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-glass-hover transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4 text-zinc-400" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-glass-hover transition-colors"
                title="Collapse"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapsed: search button under logo */}
      {collapsed && (
        <div className="flex justify-center py-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-glass-hover transition-colors"
            title="Search chats"
          >
            <Search className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2">
        {!collapsed &&
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="relative group"
              onMouseEnter={() => setHoveredConv(conv.id)}
              onMouseLeave={() => setHoveredConv(null)}
            >
              <button
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full text-left px-3 py-2 pr-8 rounded-lg text-sm truncate transition-colors mb-1",
                  activeConvId === conv.id
                    ? "bg-accent-orange/10 text-accent-orange"
                    : "text-zinc-400 hover:bg-glass-hover hover:text-white"
                )}
              >
                {conv.title || "New Conversation"}
              </button>
              {onDeleteConversation && hoveredConv === conv.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Delete conversation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="border-t border-glass-border p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center">
              <span className="text-xs font-medium text-accent-orange">
                {user.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-zinc-500 truncate capitalize">
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Collapse toggle when collapsed — centered */}
        {collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-full h-8 mb-2 rounded-lg hover:bg-glass-hover transition-colors"
            title="Expand"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400 rotate-180" />
          </button>
        )}

        <div
          className={cn(
            "flex gap-1",
            collapsed ? "flex-col items-center" : ""
          )}
        >
          <Link
            href="/admin"
            title="Admin"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-glass-hover hover:text-white transition-colors",
              collapsed && "justify-center w-10 h-10"
            )}
          >
            <Shield className="w-4 h-4" />
            {!collapsed && "Admin"}
          </Link>
          <Link
            href="/projects"
            title="Projects"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-glass-hover hover:text-white transition-colors",
              collapsed && "justify-center w-10 h-10"
            )}
          >
            <FolderOpen className="w-4 h-4" />
            {!collapsed && "Projects"}
          </Link>
        </div>

        {/* Logout — separate, with border-top for visibility */}
        <div
          className={cn(
            "mt-2 pt-2 border-t border-glass-border",
            collapsed ? "flex justify-center" : ""
          )}
        >
          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            title="Logout"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300",
              collapsed && "justify-center w-10 h-10"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
