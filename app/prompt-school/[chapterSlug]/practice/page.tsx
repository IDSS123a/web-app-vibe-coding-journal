/**
 * Prompt School practice: all exercises of a chapter, graded on the server one attempt at a time.
 * The running chapter score is the average best score over ALL exercises (untried count as 0), the
 * same rule the server uses (features/prompt-school/domain.ts chapterScore). Premium-only.
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { ExercisePlayer, type PublicExercise } from "@/components/prompt-school/ExercisePlayer";
import { BookPopup } from "@/components/prompt-school/BookPopup";
import { PASS_SCORE, chapterPassed, chapterScore } from "@/features/prompt-school/domain";

interface ChapterData {
  chapter: { slug: string; title: string };
  practiceAvailable: boolean;
  exercises: PublicExercise[];
}

function Practice() {
  const { chapterSlug } = useParams<{ chapterSlug: string }>();
  const { token, loading: sessionLoading } = useSession();
  const [data, setData] = useState<ChapterData | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    fetch(`/api/prompt-school/chapters/${chapterSlug}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 404) throw new Error("missing");
        if (r.status === 403) throw new Error("locked");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: ChapterData) => {
        if (!active) return;
        setData(d);
        const initial: Record<string, number> = {};
        for (const e of d.exercises) if (e.bestScore !== null) initial[e.id] = e.bestScore;
        setBest(initial);
      })
      .catch((e: Error) => {
        if (active) setError(e.message === "missing" ? "This chapter is not available yet." : e.message === "locked" ? "This chapter opens when you complete the previous chapter." : "Failed to load the practice.");
      });
    return () => {
      active = false;
    };
  }, [token, sessionLoading, chapterSlug]);

  const onChecked = useCallback((id: string, bestScore: number) => setBest((prev) => ({ ...prev, [id]: bestScore })), []);

  const ids = data?.exercises.map((e) => e.id) ?? [];
  const score = chapterScore(best, ids);
  const passed = ids.length > 0 && chapterPassed(score);

  return (
    <div className="min-h-dvh bg-white px-4 py-10 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href={`/prompt-school/${chapterSlug}`} className="mb-6 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
          ← {data?.chapter.title ?? "Chapter"}
        </Link>

        {error && <p role="alert" className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}
        {!data && !error && <p className="text-sm text-black opacity-60">Loading…</p>}

        {data && !data.practiceAvailable && (
          <p role="alert" className="border-4 border-black p-4 text-sm text-black">
            The practice opens when you have finished every lesson of this chapter.{" "}
            <Link href={`/prompt-school/${chapterSlug}`} className="font-bold underline decoration-2 underline-offset-4 hover:text-[#FF3000]">Back to the lessons</Link>
          </p>
        )}

        {data && data.practiceAvailable && token && (
          <>
            <div className="sticky top-16 z-30 mb-8 border-4 border-black bg-white p-3 sm:top-[4.25rem]" role="status" aria-live="polite">
              <p className="text-xs font-bold uppercase tracking-widest text-black">
                Chapter score {Math.round(score * 100)}% · pass at {Math.round(PASS_SCORE * 100)}%
                {passed && <span className="ml-2 text-[#FF3000]">Chapter complete ✓</span>}
              </p>
              <div className="mt-2 h-2 border-2 border-black" aria-hidden="true">
                <div className="h-full bg-black" style={{ width: `${Math.round(score * 100)}%` }} />
              </div>
            </div>

            <h1 className="mb-6 text-3xl font-black uppercase tracking-tighter text-black md:text-4xl">Practice</h1>

            {passed && (
              <p role="status" className="mb-6 border-l-8 border-black py-1 pl-3 text-sm text-black">
                You have passed this chapter. The next chapter opens in the School once it is written.{" "}
                <Link href="/prompt-school" className="font-bold underline decoration-2 underline-offset-4 hover:text-[#FF3000]">Back to the School</Link>
              </p>
            )}

            <div className="space-y-8">
              {data.exercises.map((ex, i) => (
                <ExercisePlayer key={ex.id} exercise={{ ...ex, bestScore: best[ex.id] ?? null }} token={token} index={i + 1} total={data.exercises.length} onChecked={onChecked} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PromptSchoolPracticePage() {
  return (
    <PremiumGuard accessKey="hasPromptSchoolAccess">
      <Practice />
      <BookPopup />
    </PremiumGuard>
  );
}
