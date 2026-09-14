/**
 * Vibe-Coding University — one lesson. Premium-only (PremiumGuard).
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { Course, Lesson } from "@/lib/validation/schemas";

function LessonReader() {
  const params = useParams<{ courseSlug: string; lessonSlug: string }>();
  const { token, loading: sessionLoading } = useSession();
  const [data, setData] = useState<{ course: Course; lesson: Lesson } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetch(`/api/university/courses/${params.courseSlug}/lessons/${params.lessonSlug}`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { course: Course; lesson: Lesson; alreadyCompleted: boolean }) => {
        setData(d);
        setCompleted(d.alreadyCompleted);
      })
      .catch(() => setError("Failed to load lesson."))
      .finally(() => setLoading(false));
  }, [token, sessionLoading, params.courseSlug, params.lessonSlug]);

  async function markComplete() {
    if (!token || !data) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/university/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: data.course.id, lesson_id: data.lesson.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompleted(true);
    } catch {
      setError("Failed to mark this lesson complete.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return <p className="p-12 text-center text-sm text-black opacity-60">Loading…</p>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white px-4 py-12">
        <p className="mx-auto max-w-2xl border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">
          {error ?? "Lesson not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-2xl">
        <a
          href="/university"
          className="text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          ← University
        </a>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
          {data.course.title}
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tighter text-black">
          {data.lesson.title}
        </h1>
        <MarkdownContent className="mt-8">{data.lesson.body ?? ""}</MarkdownContent>

        <button
          type="button"
          onClick={markComplete}
          disabled={completing || completed}
          className="mt-12 h-14 w-full border-4 border-black bg-black text-sm font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completed ? "Completed ✓" : completing ? "Saving…" : "Mark Lesson Complete"}
        </button>
      </div>
    </div>
  );
}

export default function LessonPage() {
  return (
    <PremiumGuard>
      <LessonReader />
    </PremiumGuard>
  );
}
