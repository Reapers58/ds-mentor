"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CheckSquare, MessageSquare } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  is_completed: boolean;
  assignee_id: string | null;
}

interface ProjectUpdate {
  id: string;
  content: string;
  update_type: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  health: string;
  created_at: string;
  tasks?: Task[];
  updates?: ProjectUpdate[];
}

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch {
      // silent
    }
  };

  const loadProjectDetail = async (id: string) => {
    try {
      const data = await api.getProject(id);
      setSelected(data);
    } catch {
      // silent
    }
  };

  const healthBadge = (h: string) => {
    if (h === "green") return <Badge variant="success">On Track</Badge>;
    if (h === "yellow") return <Badge variant="warning">At Risk</Badge>;
    return <Badge variant="danger">Critical</Badge>;
  };

  const statusBadge = (s: string) => {
    if (s === "todo") return <Badge variant="outline">To Do</Badge>;
    if (s === "in_progress") return <Badge variant="blue">In Progress</Badge>;
    if (s === "done") return <Badge variant="success">Done</Badge>;
    return <Badge variant="danger">Blocked</Badge>;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        conversations={[]}
        activeConvId={null}
        onSelectConversation={() => {}}
        onNewChat={() => router.push("/")}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {selected ? (
            /* Project Detail */
            <div>
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to projects
              </button>

              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">{selected.name}</h1>
                {healthBadge(selected.health)}
              </div>

              <p className="text-sm text-zinc-400 mb-6">{selected.description}</p>

              {/* Meta */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-medium text-white capitalize">{selected.status.replace("_", " ")}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Tasks</p>
                  <p className="text-sm font-medium text-white">{selected.tasks?.length || 0} total</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Updates</p>
                  <p className="text-sm font-medium text-white">{selected.updates?.length || 0}</p>
                </div>
              </div>

              {/* Tasks */}
              <div className="glass-card mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="w-4 h-4 text-accent-orange" />
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Tasks</h2>
                </div>
                <div className="space-y-2">
                  {selected.tasks?.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-glass-hover transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex-shrink-0 ${
                          t.is_completed
                            ? "bg-accent-orange border-accent-orange"
                            : "border-zinc-600"
                        }`}
                      />
                      <span className="flex-1 text-sm text-zinc-300">{t.title}</span>
                      {statusBadge(t.status)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Updates */}
              <div className="glass-card">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-accent-orange" />
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Updates</h2>
                </div>
                <div className="space-y-2">
                  {selected.updates?.map((u) => (
                    <div key={u.id} className="p-3 rounded-lg bg-surface border border-glass-border">
                      <p className="text-sm text-zinc-300">{u.content}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {u.update_type} &middot; {formatDate(u.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Project Grid */
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Project Health</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadProjectDetail(p.id)}
                    className="glass-card text-left group"
                  >
                    <div className="mb-2">{healthBadge(p.health)}</div>
                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-accent-orange transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                      {p.description?.slice(0, 120)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(p.created_at)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
