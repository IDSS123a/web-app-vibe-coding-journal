/**
 * Prompt School lesson: the text, mark as done, previous and next. Premium-only.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { useRewards, type NewBadge, type ServerReward } from "@/components/rewards/RewardsProvider";
import { PremiumGuard } from "@/components/PremiumGuard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { BookPopup } from "@/components/prompt-school/BookPopup";

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
  const { applyReward } = useRewards();

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    setData(null);
    setError(null);
    fetch(`/api/prompt-school/lessons/${chapterSlug}/${lessonSlug}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 404) throw new Error("missing");
        if (r.status === 403) throw new Error("locked");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: LessonData) => {
        if (!active) return;
        setData(d);
        setCompleted(d.lesson.completed);
      })
      .catch((e: Error) => {
        if (active) setError(e.message === "missing" ? "This lesson was not found." : e.message === "locked" ? "This chapter opens when you complete the previous chapter." : "Failed to load the lesson.");
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
      const body = (await res.json().catch(() => ({}))) as { reward?: ServerReward | null; badges?: NewBadge[] };
      setCompleted(true);
      applyReward([body.reward], body.badges);
    } catch {
      setError("Failed to save your progress.");
    } finally {
      setSaving(false);
    }
  }

  const navLink =
    "inline-flex min-h-11 items-center justify-center border-4 border-studio-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-studio-ink transition-colors duration-150 ease-out hover:border-signal hover:text-signal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal";

  return (
    <div className="k-page layer-campus">
      <article className="mx-auto max-w-3xl text-studio-ink">
        <Link href={`/prompt-school/${chapterSlug}`} className="mb-6 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-cbtn">
          ← {data?.chapter.title ?? "Chapter"}
        </Link>

        {error && <p role="alert" className="mb-4 k-card-sm border-signal p-3 text-sm text-signal">{error}</p>}
        {!data && !error && <p className="text-sm opacity-60">Loading…</p>}

        {data && (
          <>
            <div className="mb-8 border-b border-studio-ink pb-6">
              <p className="mb-2 text-studio-blueberry k-clabel">
                Lesson {data.position.index} of {data.position.total}, {data.lesson.minutes} min
              </p>
              <h1 className="break-words k-cheading">{data.lesson.title}</h1>
            </div>

            <MarkdownContent>{data.lesson.body}</MarkdownContent>

            <div className="mt-10 border-t border-studio-ink pt-6">
              {completed ? (
                <p className="mb-4 k-clabel">Lesson done ✓</p>
              ) : (
                <button
                  type="button"
                  onClick={markDone}
                  disabled={saving}
                  className="mb-4 inline-flex min-h-11 w-full items-center justify-center disabled:opacity-40 sm:w-auto k-cbtn k-cbtn-primary"
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
      <BookPopup />
    </PremiumGuard>
  );
}
