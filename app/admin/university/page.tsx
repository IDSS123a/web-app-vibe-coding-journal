/**
 * Admin: University — review queue for AI-generated lessons, mirroring
 * /admin/review-queue's approve/reject pattern (specs/vibe-coding-
 * university/PLAN.md).
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import type { Lesson } from "@/lib/validation/schemas";

export default function AdminUniversityPage() {
  const { token, loading: sessionLoading } = useSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
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
      <div className="mb-8 border-b-4 border-black pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Curriculum</p>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">University Review Queue</h2>
        <p className="mt-2 text-sm text-black">
          AI-generated lessons, one per week (specs/vibe-coding-university/PLAN.md). Nothing here reaches a
          subscriber until approved.
        </p>
      </div>

      {actionMsg && <p className="mb-6 border-2 border-black p-3 text-sm text-black">{actionMsg}</p>}
      {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
      {error && <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

      {!loading && !error && lessons.length === 0 && (
        <p className="border-4 border-black py-16 text-center text-sm italic text-black opacity-60">
          No lessons pending review.
        </p>
      )}

      <div className="space-y-8">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="border-4 border-black p-8">
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">{lesson.title}</h3>
            <div className="swiss-grid-pattern mt-4 max-h-96 overflow-y-auto border-2 border-black bg-[#F2F2F2] p-4 text-sm text-black">
              <pre className="whitespace-pre-wrap font-sans">{lesson.body}</pre>
            </div>
            {lesson.candidate_terms.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                  Proposed Dictionary Terms
                </p>
                <ul className="mt-2 space-y-1 text-sm text-black">
                  {lesson.candidate_terms.map((t, i) => (
                    <li key={i}>
                      <strong>{t.term}:</strong> {t.definition}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={() => review(lesson.id, "published")}
                className="h-12 border-4 border-black bg-black px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
              >
                Approve &amp; Publish
              </button>
              <button
                type="button"
                onClick={() => review(lesson.id, "stub")}
                className="h-12 border-4 border-black bg-white px-6 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000]"
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
