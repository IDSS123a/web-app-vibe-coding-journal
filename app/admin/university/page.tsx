/**
 * Admin: University — review queue for AI-generated lessons, mirroring
 * /admin/review-queue's approve/reject pattern (specs/vibe-coding-
 * university/PLAN.md).
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { Lesson } from "@/lib/validation/schemas";

// PDL-042: the admin API now joins courses(slug) onto each pending
// lesson so the reviewer can see which level the AI classified it
// into -- previously this page showed no course/level context at all.
type PendingLesson = Lesson & { course_slug: string };

export default function AdminUniversityPage() {
  const { token, loading: sessionLoading } = useSession();
  const [lessons, setLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionLoading]);

  async function fetchLessons() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/university", { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLessons(data.lessons);
    } catch {
      setError("Failed to load lessons pending review.");
    } finally {
      setLoading(false);
    }
  }

  async function review(lessonId: string, decision: "published" | "stub") {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/university/${lessonId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActionMsg(decision === "published" ? "Lesson published." : "Lesson rejected, returned to the queue.");
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } catch {
      setError("Failed to submit review decision.");
    }
  }

  return (
    <div>
      <div className="mb-8 border-b border-console-line pb-6">
        <p className="mb-2 text-signal k-label">Curriculum</p>
        <h2 className="text-console-text k-h2">University Review Queue</h2>
        <p className="mt-2 text-sm text-console-text">
          AI-generated lessons, one per week (specs/vibe-coding-university/PLAN.md). Nothing here reaches a
          subscriber until approved.
        </p>
      </div>

      {actionMsg && <p className="mb-6 border border-console-line p-3 text-sm text-console-text">{actionMsg}</p>}
      {loading && <p className="text-sm text-console-text opacity-60">Loading…</p>}
      {error && <p className="border border-signal p-3 text-sm text-signal">{error}</p>}

      {!loading && !error && lessons.length === 0 && (
        <p className="border border-console-line py-16 text-center text-sm italic text-console-text opacity-60">
          No lessons pending review.
        </p>
      )}

      <div className="space-y-8">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="border border-console-line p-8">
            <p className="mb-1 text-signal k-label">
              {lesson.course_slug} , Supplementary
            </p>
            <h3 className="text-console-text k-h4">{lesson.title}</h3>
            <div className="swiss-grid-pattern mt-4 max-h-96 overflow-y-auto border border-console-line bg-paper-2 p-4 text-console-text">
              <MarkdownContent>{lesson.body ?? ""}</MarkdownContent>
            </div>
            {lesson.candidate_terms.length > 0 && (
              <div className="mt-4">
                <p className="text-signal k-label">
                  Proposed Dictionary Terms
                </p>
                <ul className="mt-2 space-y-1 text-sm text-console-text">
                  {lesson.candidate_terms.map((t, i) => (
                    <li key={i}>
                      <strong>{t.term}:</strong> {t.definition}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => review(lesson.id, "published")}
                className="h-12 k-btn k-btn-primary"
              >
                Approve &amp; Publish
              </button>
              <button
                type="button"
                onClick={() => review(lesson.id, "stub")}
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
