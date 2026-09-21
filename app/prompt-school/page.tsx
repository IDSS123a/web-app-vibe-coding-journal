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
import { BookPopup } from "@/components/prompt-school/BookPopup";

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

interface LevelTestCard {
  questionCount: number;
  unlocked: boolean;
  remainingChapters: string[];
  attempts: number;
  bestScore: number;
  passed: boolean;
  passScore: number;
}

interface Level {
  id: string;
  label: string;
  blurb: string;
  levelTest: LevelTestCard | null;
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
    <div className="k-page layer-campus">
      <div className="mx-auto max-w-4xl xl:max-w-5xl">
        <div className="mb-10 border-b border-studio-ink pb-8">
          <p className="mb-2 text-studio-blueberry k-clabel">Premium</p>
          <h1 className="break-words text-studio-ink k-cheading">
            Prompt School - <span lang="grc" className="normal-case">Ἀγορά</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-studio-ink">
            Learn to write prompts that work, from a first clear request to advanced techniques. The course follows the
            book Mastering Prompt Engineering. Every chapter has short lessons and hands-on practice: you complete,
            order, repair and write prompts, and each attempt is checked at once. Finish a chapter&apos;s lessons to open its
            practice, and pass the practice to open the next chapter.
          </p>
          {levels.length > 0 && (
            <p className="mt-3 text-studio-ink k-clabel">
              {open === chapterTotal ? `${chapterTotal} chapters, ${planned} lessons` : `${open} of ${chapterTotal} chapters written, about ${planned} lessons planned`}
            </p>
          )}
        </div>

        {loading && <p className="text-sm text-studio-ink opacity-60">Loading…</p>}
        {error && <p role="alert" className="k-card-sm border-signal p-3 text-sm text-signal">{error}</p>}

        <div className="space-y-14">
          {levels.map((level) => (
            <section key={level.id} aria-labelledby={`level-${level.id}`}>
              <div className="mb-5 border-b border-studio-ink pb-3">
                <h2 id={`level-${level.id}`} className="text-studio-ink k-h3">{level.label}</h2>
                <p className="text-sm text-studio-ink">{level.blurb}</p>
              </div>
              <ul className="grid gap-4 md:grid-cols-2">
                {level.chapters.map((c) => (
                  <li key={c.slug} className={`flex flex-col k-card p-4 sm:p-5 ${c.open && c.unlocked ? "" : "opacity-60"}`}>
                    <p className="mb-1 text-studio-blueberry k-clabel">{c.bookRef}</p>
                    <h3 className="mb-2 text-studio-ink k-h4">{c.title}</h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-studio-ink">{c.summary}</p>
                    {c.open && !c.unlocked ? (
                      <p className="text-studio-ink k-clabel">
                        <span aria-hidden="true">🔒 </span>Locked: complete {c.waitingFor ? `"${c.waitingFor}"` : "the previous chapter"} first
                      </p>
                    ) : c.open ? (
                      <>
                        <p className="mb-3 text-studio-ink k-clabel">
                          {c.lessonsDone} of {c.lessonCount} lessons, {c.exerciseCount} exercises
                          {c.passed ? " · Chapter complete ✓" : c.score > 0 ? ` · ${Math.round(c.score * 100)}%` : ""}
                        </p>
                        <Link
                          href={`/prompt-school/${c.slug}`}
                          className="inline-flex min-h-11 items-center justify-center k-cbtn k-cbtn-primary"
                        >
                          {c.lessonsDone > 0 || c.score > 0 ? "Continue" : "Start"} →
                        </Link>
                      </>
                    ) : (
                      <p className="text-studio-ink k-clabel">
                        Coming soon, about {c.plannedLessons} lessons
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {level.levelTest && level.levelTest.questionCount > 0 && (
                <div className="mt-5 k-card p-4 sm:p-5" data-testid={`level-test-${level.id}`}>
                  <p className="mb-1 text-studio-blueberry k-clabel">Level test</p>
                  <h3 className="mb-2 text-studio-ink k-h4">
                    {level.label} level test{level.levelTest.passed ? " · Passed ✓" : ""}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-studio-ink">
                    {level.levelTest.questionCount} new questions from every chapter of this level, answered in one sitting and
                    graded together. Pass at {Math.round(level.levelTest.passScore * 100)}%.
                    {level.levelTest.attempts > 0 && ` Best so far: ${Math.round(level.levelTest.bestScore * 100)}% in ${level.levelTest.attempts} ${level.levelTest.attempts === 1 ? "attempt" : "attempts"}.`}
                  </p>
                  {level.levelTest.unlocked ? (
                    <Link
                      href={`/prompt-school/level-test/${level.id}`}
                      className="inline-flex min-h-11 items-center justify-center k-cbtn k-cbtn-primary"
                    >
                      {level.levelTest.attempts > 0 ? "Take it again" : "Start the test"} →
                    </Link>
                  ) : (
                    <p className="text-studio-ink k-clabel">
                      <span aria-hidden="true">🔒 </span>Locked: complete {level.levelTest.remainingChapters.length === 1 ? `"${level.levelTest.remainingChapters[0]}"` : `the ${level.levelTest.remainingChapters.length} remaining chapters of this level`} first
                    </p>
                  )}
                </div>
              )}
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
      <BookPopup />
    </PremiumGuard>
  );
}
