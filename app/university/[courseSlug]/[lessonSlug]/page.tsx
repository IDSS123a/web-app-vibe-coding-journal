/**
 * Vibe-Coding University — one lesson. Premium-only (PremiumGuard).
 */

"use client";

import Link from "next/link";
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
    return <p className="p-12 text-center text-sm text-studio-ink opacity-60">Loading…</p>;
  }

  if (error || !data) {
    return (
      <div className="k-page layer-campus">
        <p className="mx-auto max-w-2xl k-card-sm border-signal p-3 text-sm text-signal">
          {error ?? "Lesson not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="k-page layer-campus">
      <div className="mx-auto max-w-2xl xl:max-w-3xl">
        <Link
          href="/university"
          className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-cbtn"
        >
          ← University
        </Link>
        <p className="mt-6 text-studio-blueberry k-clabel">
          {data.course.title}
        </p>
        <h1 className="mt-2 text-studio-ink k-cheading">
          {data.lesson.title}
        </h1>
        <MarkdownContent className="mt-8">{data.lesson.body ?? ""}</MarkdownContent>

        <button
          type="button"
          onClick={markComplete}
          disabled={completing || completed}
          className="mt-12 h-14 w-full disabled:cursor-not-allowed disabled:opacity-50 k-cbtn k-cbtn-primary"
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
