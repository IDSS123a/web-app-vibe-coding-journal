/**
 * Admin: Ideas — review queue for AI-generated profitable ideas, mirroring
 * /admin/university's approve/reject pattern.
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { IdeaRow } from "@/features/ideas/repository";

export default function AdminIdeasPage() {
  const { token, loading: sessionLoading } = useSession();
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetchIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionLoading]);

  async function fetchIdeas() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/ideas", { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIdeas(data.ideas);
    } catch {
      setError("Failed to load ideas pending review.");
    } finally {
      setLoading(false);
    }
  }

  async function review(ideaId: string, decision: "published" | "rejected") {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/ideas/${ideaId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActionMsg(decision === "published" ? "Idea published." : "Idea rejected.");
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    } catch {
      setError("Failed to submit review decision.");
    }
  }

  return (
    <div>
      <div className="mb-8 border-b border-console-line pb-6">
        <p className="mb-2 text-signal k-label">Top Profitable Ideas</p>
        <h2 className="text-console-text k-h2">Ideas Review Queue</h2>
        <p className="mt-2 text-sm text-console-text">
          AI-generated ideas, about one a week, from trends across recent articles. Nothing here reaches a
          subscriber until approved.
        </p>
      </div>

      {actionMsg && <p className="mb-6 border border-console-line p-3 text-sm text-console-text">{actionMsg}</p>}
      {loading && <p className="text-sm text-console-text opacity-60">Loading…</p>}
      {error && <p className="border border-signal p-3 text-sm text-signal">{error}</p>}

      {!loading && !error && ideas.length === 0 && (
        <p className="border border-console-line py-16 text-center text-sm italic text-console-text opacity-60">
          No ideas pending review.
        </p>
      )}

      <div className="space-y-8">
        {ideas.map((idea) => (
          <div key={idea.id} className="border border-console-line p-8">
            <h3 className="text-console-text k-h4">{idea.title}</h3>
            <p className="mt-1 text-sm italic text-console-text">{idea.pitch}</p>
            <div className="swiss-grid-pattern mt-4 max-h-96 overflow-y-auto border border-console-line bg-console-panel p-4 text-console-text">
              <MarkdownContent>{idea.body ?? ""}</MarkdownContent>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => review(idea.id, "published")}
                className="h-12 k-btn k-btn-primary"
              >
                Approve &amp; Publish
              </button>
              <button
                type="button"
                onClick={() => review(idea.id, "rejected")}
                className="h-12 k-btn"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
