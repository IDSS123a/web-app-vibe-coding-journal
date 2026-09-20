/**
 * Prompt School chapter: its lessons in order and a link to the practice. Premium-only.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { BookPopup } from "@/components/prompt-school/BookPopup";

interface ChapterData {
  chapter: { slug: string; level: string; title: string; summary: string; bookRef: string | null };
  lessons: Array<{ slug: string; title: string; minutes: number; completed: boolean }>;
  practiceAvailable: boolean;
  exerciseCount: number;
  exercises: Array<{ id: string; bestScore: number | null }>;
  score: number;
  passed: boolean;
}

function Chapter() {
  const { chapterSlug } = useParams<{ chapterSlug: string }>();
  const { token, loading: sessionLoading } = useSession();
  const [data, setData] = useState<ChapterData | null>(null);
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
        if (active) setData(d);
      })
      .catch((e: Error) => {
        if (active) setError(e.message === "missing" ? "This chapter is not available yet." : e.message === "locked" ? "This chapter opens when you complete the previous chapter." : "Failed to load the chapter.");
      });
    return () => {
      active = false;
    };
  }, [token, sessionLoading, chapterSlug]);

  const doneCount = data?.lessons.filter((l) => l.completed).length ?? 0;
  const attempted = data?.exercises.filter((e) => e.bestScore !== null).length ?? 0;

  return (
    <div className="min-h-dvh bg-white px-4 py-10 md:px-12 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/prompt-school" className="mb-6 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
          ← Prompt School
        </Link>

        {error && <p role="alert" className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}
        {!data && !error && <p className="text-sm text-black opacity-60">Loading…</p>}

        {data && (
          <>
            <div className="mb-8 border-b-4 border-black pb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                {data.chapter.level}
                {data.chapter.bookRef ? `, book ${data.chapter.bookRef.toLowerCase()}` : ""}
              </p>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-black md:text-4xl">{data.chapter.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-black">{data.chapter.summary}</p>
            </div>

            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-black">
              Lessons ({doneCount} of {data.lessons.length} done)
            </h2>
            <ol className="mb-10 space-y-2">
              {data.lessons.map((l, i) => (
                <li key={l.slug}>
                  <Link
                    href={`/prompt-school/${data.chapter.slug}/${l.slug}`}
                    className="flex min-h-11 items-center gap-3 border-4 border-black px-3 py-2 text-sm text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000]"
                  >
                    <span aria-hidden="true" className="w-5 shrink-0 font-black">{i + 1}</span>
                    <span className="min-w-0 flex-1 break-words font-bold">{l.title}</span>
                    <span className="shrink-0 text-xs uppercase tracking-widest">{l.completed ? "Done ✓" : `${l.minutes} min`}</span>
                  </Link>
                </li>
              ))}
            </ol>

            <div className="border-4 border-black p-4 sm:p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Practice</p>
              <h2 className="mb-2 text-xl font-black uppercase tracking-tight text-black">
                {data.exerciseCount} exercises
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-black">
                Complete, order, spot and repair prompts. Each attempt is checked at once. Pass the practice with an
                average of 75 percent to complete the chapter and open the next one.
                {attempted > 0 && ` You have tried ${attempted} of ${data.exerciseCount} and stand at ${Math.round(data.score * 100)} percent${data.passed ? ", so this chapter is complete." : "."}`}
              </p>
              {data.practiceAvailable ? (
                <Link
                  href={`/prompt-school/${data.chapter.slug}/practice`}
                  className="inline-flex min-h-11 w-full items-center justify-center border-4 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] sm:w-auto"
                >
                  {attempted > 0 ? "Continue practice" : "Start practice"} →
                </Link>
              ) : (
                <p className="border-l-8 border-[#FF3000] py-1 pl-3 text-xs font-bold uppercase tracking-widest text-black">
                  <span aria-hidden="true">🔒 </span>Finish all {data.lessons.length} lessons to open the practice ({doneCount} done)
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PromptSchoolChapterPage() {
  return (
    <PremiumGuard accessKey="hasPromptSchoolAccess">
      <Chapter />
      <BookPopup />
    </PremiumGuard>
  );
}
