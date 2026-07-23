"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, RefreshCw } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  roles: string[];
  description: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [roles, setRoles] = useState("developer,qa,pm,devops,po");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch {
      // silent
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("roles", roles);
      fd.append("description", description);
      await api.uploadDocument(fd);
      setFile(null);
      setDescription("");
      loadDocuments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.deleteDocument(id);
      loadDocuments();
    } catch {
      // silent
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await api.reindexDocuments();
      alert(res.message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Reindex failed";
      alert(message);
    } finally {
      setReindexing(false);
    }
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>

          {/* Upload Section */}
          <div className="glass-card mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Upload SOP Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drop zone */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-accent-orange/30 rounded-xl bg-accent-orange/5 hover:bg-accent-orange/10 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-accent-orange/50 mb-2" />
                <span className="text-sm text-zinc-400">
                  {file ? file.name : "Click to select PDF"}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  className="hidden"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Roles (comma-separated)</label>
                  <input
                    type="text"
                    value={roles}
                    onChange={(e) => setRoles(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    className="flex h-10 w-full rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/50 transition-colors"
                  />
                </div>
              </div>

              <Button type="submit" disabled={uploading || !file} className="w-full md:w-auto">
                {uploading ? "Uploading..." : "Upload & Index"}
              </Button>
            </form>
          </div>

          {/* Documents List */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Documents</h2>
              <Button variant="outline" size="sm" onClick={handleReindex} disabled={reindexing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${reindexing ? "animate-spin" : ""}`} />
                {reindexing ? "Reindexing..." : "Reindex All"}
              </Button>
            </div>

            {documents.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface border border-glass-border hover:bg-glass-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {doc.original_filename}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.roles.map((r) => (
                          <Badge key={r} variant="default" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{formatDate(doc.created_at)}</p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="ml-4 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
