/**
 * Prompt School lesson: the text, mark as done, previous and next. Premium-only.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { MarkdownContent } from "@/components/MarkdownContent";

interface LessonData {
  chapter: { slug: string; title: string };
  lesson: { slug: string; title: string; minutes: number; body: string; completed: boolean };
  position: { index: number; total: number };
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

function Lesson() {
  const { chapterSlug, lessonSlug } = useParams<{ chapterSlug: string; lessonSlug: string }>();
  const { token, loading: sessionLoading } = useSession();
  const [data, setData] = useState<LessonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    setData(null);
    setError(null);
    fetch(`/api/prompt-school/lessons/${chapterSlug}/${lessonSlug}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 404) throw new Error("missing");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: LessonData) => {
        if (!active) return;
        setData(d);
        setCompleted(d.lesson.completed);
      })
      .catch((e: Error) => {
        if (active) setError(e.message === "missing" ? "This lesson was not found." : "Failed to load the lesson.");
      });
    return () => {
      active = false;
    };
  }, [token, sessionLoading, chapterSlug, lessonSlug]);

  async function markDone() {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/prompt-school/lessons/${chapterSlug}/${lessonSlug}/complete`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompleted(true);
    } catch {
      setError("Failed to save your progress.");
    } finally {
      setSaving(false);
    }
  }

  const navLink =
    "inline-flex min-h-11 items-center justify-center border-4 border-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000]";

  return (
    <div className="min-h-dvh bg-white px-4 py-10 md:px-12 md:py-12">
      <article className="mx-auto max-w-3xl text-black">
        <Link href={`/prompt-school/${chapterSlug}`} className="mb-6 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
          ← {data?.chapter.title ?? "Chapter"}
        </Link>

        {error && <p role="alert" className="mb-4 border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}
        {!data && !error && <p className="text-sm opacity-60">Loading…</p>}

        {data && (
          <>
            <div className="mb-8 border-b-4 border-black pb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                Lesson {data.position.index} of {data.position.total}, {data.lesson.minutes} min
              </p>
              <h1 className="break-words text-3xl font-black uppercase tracking-tighter md:text-4xl">{data.lesson.title}</h1>
            </div>

            <MarkdownContent>{data.lesson.body}</MarkdownContent>

            <div className="mt-10 border-t-4 border-black pt-6">
              {completed ? (
                <p className="mb-4 text-xs font-bold uppercase tracking-widest">Lesson done ✓</p>
              ) : (
                <button
                  type="button"
                  onClick={markDone}
                  disabled={saving}
                  className="mb-4 inline-flex min-h-11 w-full items-center justify-center border-4 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] disabled:opacity-40 sm:w-auto"
                >
                  {saving ? "Saving…" : "Mark lesson as done"}
                </button>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                {data.previous ? (
                  <Link href={`/prompt-school/${chapterSlug}/${data.previous.slug}`} className={navLink}>← Previous</Link>
                ) : (
                  <span />
                )}
                {data.next ? (
                  <Link href={`/prompt-school/${chapterSlug}/${data.next.slug}`} className={navLink}>Next lesson →</Link>
                ) : (
                  <Link href={`/prompt-school/${chapterSlug}/practice`} className={navLink}>Go to practice →</Link>
                )}
              </div>
            </div>
          </>
        )}
      </article>
    </div>
  );
}

export default function PromptSchoolLessonPage() {
  return (
    <PremiumGuard accessKey="hasPromptSchoolAccess">
      <Lesson />
    </PremiumGuard>
  );
}
