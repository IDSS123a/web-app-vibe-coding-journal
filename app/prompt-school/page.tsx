/**
 * Prompt School (specs/prompt-school/): overview of the whole planned course, three levels of chapters
 * mapped to the Director's book. Premium-only (PremiumGuard). Client-rendered like University because
 * the session lives in the browser.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";

type ChapterCard =
  | { slug: string; title: string; summary: string; bookRef: string; plannedLessons: number; open: false }
  | {
      slug: string;
      title: string;
      summary: string;
      bookRef: string;
      plannedLessons: number;
      open: true;
      unlocked: boolean;
      waitingFor: string | null;
      lessonCount: number;
      lessonsDone: number;
      exerciseCount: number;
      score: number;
      passed: boolean;
    };

interface Level {
  id: string;
  label: string;
  blurb: string;
  chapters: ChapterCard[];
}

function Overview() {
  const { token, loading: sessionLoading } = useSession();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    fetch("/api/prompt-school", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { levels: Level[] }) => {
        if (active) setLevels(d.levels);
      })
      .catch(() => {
        if (active) setError("Failed to load the Prompt School.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, sessionLoading]);

  const planned = levels.reduce((n, l) => n + l.chapters.reduce((m, c) => m + c.plannedLessons, 0), 0);
  const open = levels.reduce((n, l) => n + l.chapters.filter((c) => c.open).length, 0);
  const chapterTotal = levels.reduce((n, l) => n + l.chapters.length, 0);

  return (
    <div className="min-h-dvh bg-white px-4 py-10 md:px-12 md:py-12">
      <div className="mx-auto max-w-4xl xl:max-w-5xl">
        <div className="mb-10 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Premium</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black md:text-5xl">Prompt School</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black">
            Learn to write prompts that work, from a first clear request to advanced techniques. The course follows the
            book Mastering Prompt Engineering. Every chapter has short lessons and hands-on practice: you complete,
            order, repair and write prompts, and each attempt is checked at once. Finish a chapter&apos;s lessons to open its
            practice, and pass the practice to open the next chapter.
          </p>
          {levels.length > 0 && (
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-black">
              {open} of {chapterTotal} chapters open, about {planned} lessons planned
            </p>
          )}
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p role="alert" className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

        <div className="space-y-14">
          {levels.map((level) => (
            <section key={level.id} aria-labelledby={`level-${level.id}`}>
              <div className="mb-5 border-b-2 border-black pb-3">
                <h2 id={`level-${level.id}`} className="text-2xl font-black uppercase tracking-tight text-black">{level.label}</h2>
                <p className="text-sm text-black">{level.blurb}</p>
              </div>
              <ul className="grid gap-4 md:grid-cols-2">
                {level.chapters.map((c) => (
                  <li key={c.slug} className={`flex flex-col border-4 border-black p-4 sm:p-5 ${c.open && c.unlocked ? "" : "opacity-60"}`}>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#FF3000]">{c.bookRef}</p>
                    <h3 className="mb-2 text-lg font-black uppercase leading-tight tracking-tight text-black">{c.title}</h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-black">{c.summary}</p>
                    {c.open && !c.unlocked ? (
                      <p className="text-xs font-bold uppercase tracking-widest text-black">
                        <span aria-hidden="true">🔒 </span>Locked: complete {c.waitingFor ? `"${c.waitingFor}"` : "the previous chapter"} first
                      </p>
                    ) : c.open ? (
                      <>
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-black">
                          {c.lessonsDone} of {c.lessonCount} lessons, {c.exerciseCount} exercises
                          {c.passed ? " · Chapter complete ✓" : c.score > 0 ? ` · ${Math.round(c.score * 100)}%` : ""}
                        </p>
                        <Link
                          href={`/prompt-school/${c.slug}`}
                          className="inline-flex min-h-11 items-center justify-center border-4 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000]"
                        >
                          {c.lessonsDone > 0 || c.score > 0 ? "Continue" : "Start"} →
                        </Link>
                      </>
                    ) : (
                      <p className="text-xs font-bold uppercase tracking-widest text-black">
                        Coming soon, about {c.plannedLessons} lessons
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PromptSchoolPage() {
  return (
    <PremiumGuard accessKey="hasPromptSchoolAccess">
      <Overview />
    </PremiumGuard>
  );
}
