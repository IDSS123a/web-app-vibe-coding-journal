/**
 * Prompt School level test (specs/prompt-school/, phase B): all questions of a level on one page, answered in one
 * sitting and graded together on the server. Nothing is checked per question and no explanations are shown, so a
 * retake cannot be passed by memorising a reveal; a missed question points back to its chapter instead.
 * Premium-only, and only when every chapter of the level is complete (the server decides).
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { useRewards, type NewBadge, type ServerReward } from "@/components/rewards/RewardsProvider";
import { PremiumGuard } from "@/components/PremiumGuard";
import { ExercisePlayer, type PublicExercise } from "@/components/prompt-school/ExercisePlayer";
import { BookPopup } from "@/components/prompt-school/BookPopup";

interface TestData {
  level: string;
  passScore: number;
  attempts: number;
  bestScore: number;
  passed: boolean;
  exercises: Array<Omit<PublicExercise, "bestScore">>;
}

interface TestResult {
  reward?: ServerReward | null;
  badges?: NewBadge[];
  score: number;
  passed: boolean;
  passScore: number;
  attempts: number;
  bestScore: number;
  questions: Array<{ id: string; title: string; score: number; correct: boolean; chapterSlug: string; chapterTitle: string }>;
}

const LEVEL_LABELS: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

const btn =
  "inline-flex min-h-11 items-center justify-center border-4 border-studio-ink px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal";

function LevelTest() {
  const { level } = useParams<{ level: string }>();
  const { token, loading: sessionLoading } = useSession();
  const { applyReward } = useRewards();
  const [data, setData] = useState<TestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [round, setRound] = useState(0);
  const answers = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    fetch(`/api/prompt-school/level-tests/${level}`, { headers: { authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (r.status === 403) {
          const body = (await r.json().catch(() => ({}))) as { remainingChapters?: string[] };
          const rest = body.remainingChapters ?? [];
          throw new Error(rest.length > 0 ? `This test opens when you complete every chapter of the level. Still to complete: ${rest.join(", ")}.` : "This test opens when you complete every chapter of the level.");
        }
        if (r.status === 404 || r.status === 400) throw new Error("This test is not available.");
        if (!r.ok) throw new Error("Failed to load the level test.");
        return r.json();
      })
      .then((d: TestData) => {
        if (active) setData(d);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [token, sessionLoading, level, round]);

  const onAnswer = useCallback((id: string, answer: unknown | null) => {
    if (answer === null) delete answers.current[id];
    else answers.current[id] = answer;
    setAnswered(Object.keys(answers.current).length);
  }, []);

  async function submit() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prompt-school/level-tests/${level}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answers.current }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const graded = (await res.json()) as TestResult;
      setResult(graded);
      applyReward([graded.reward], graded.badges);
      window.scrollTo({ top: 0 });
    } catch {
      setError("Could not grade the test. Your answers are still here, please try again.");
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    answers.current = {};
    setAnswered(0);
    setResult(null);
    setData(null);
    setRound((n) => n + 1);
  }

  const total = data?.exercises.length ?? 0;
  const label = LEVEL_LABELS[level] ?? level;
  const reviewChapters = result ? Array.from(new Map(result.questions.filter((q) => !q.correct).map((q) => [q.chapterSlug, q.chapterTitle])).entries()) : [];

  return (
    <div className="k-page layer-campus">
      <div className="k-wide">
        <Link href="/prompt-school" className="mb-6 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-cbtn">
          ← Prompt School
        </Link>

        <h1 className="mb-2 break-words text-studio-ink k-cheading">{label} level test</h1>

        {error && <p role="alert" className="mb-6 k-card-sm border-signal p-3 text-sm text-signal">{error}</p>}
        {!data && !error && <p className="text-sm text-studio-ink opacity-60">Loading…</p>}

        {result && (
          <div className="mb-8" role="status" aria-live="polite">
            <p className={`mb-3 border-l-8 py-1 pl-3 k-clabel ${result.passed ? "border-studio-ink text-studio-ink" : "border-signal text-signal"}`}>
              {result.passed ? "Passed" : "Not yet"}: {Math.round(result.score * 100)}%
              <span className="ml-2 text-sm font-bold normal-case tracking-normal">
                (pass at {Math.round(result.passScore * 100)}%, attempt {result.attempts}, best {Math.round(result.bestScore * 100)}%)
              </span>
              {result.reward?.coinsAwarded ? (
                <span className="ml-2 inline-block border-2 border-studio-ink bg-studio-lemon px-2 py-0.5 text-xs font-black normal-case tracking-normal text-studio-ink">+{result.reward.coinsAwarded} Vibe Coins</span>
              ) : null}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-studio-ink">
              {result.passed
                ? `You have passed the ${label.toLowerCase()} level. Well done.`
                : "You need a little more. The questions you missed are marked below, and they point to the chapters to review. Answers are not shown, so a retake tests what you learned."}
            </p>
            <ul className="mb-4 space-y-2 text-sm text-studio-ink">
              {result.questions.map((q) => (
                <li key={q.id} className="flex gap-2">
                  <span aria-hidden="true" className={`font-black ${q.correct ? "" : "text-signal"}`}>{q.correct ? "✓" : "✗"}</span>
                  <span>
                    <span className="sr-only">{q.correct ? "Correct: " : "Missed: "}</span>
                    {q.title}
                    {!q.correct && <span className="block opacity-70">Review: {q.chapterTitle}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {reviewChapters.length > 0 && (
              <p className="mb-4 text-sm text-studio-ink">
                Chapters to review:{" "}
                {reviewChapters.map(([slug, title], i) => (
                  <span key={slug}>
                    {i > 0 && ", "}
                    <Link href={`/prompt-school/${slug}`} className="font-bold underline decoration-1 underline-offset-4 hover:text-signal">{title}</Link>
                  </span>
                ))}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={retake} className={`${btn} bg-studio-ink text-white hover:border-signal hover:bg-signal`}>
                {result.passed ? "Take it again" : "Try again"}
              </button>
              <Link href="/prompt-school" className={`${btn} bg-studio-paper text-studio-ink hover:border-signal hover:text-signal`}>Back to the School</Link>
            </div>
          </div>
        )}

        {data && !result && (
          <>
            <p className="mb-6 text-sm leading-relaxed text-studio-ink">
              {total} questions that check every chapter of the level, in a single sitting. Nothing is checked until
              you press Submit, and no answers are shown afterwards, only the score and the chapters to review. Pass at{" "}
              {Math.round(data.passScore * 100)}%. You can take the test again as often as you like.
            </p>

            <div className="sticky top-16 z-30 mb-8 k-card p-3 sm:top-[4.25rem]" role="status" aria-live="polite">
              <p className="text-studio-ink k-clabel">
                {answered} of {total} answered
                {data.attempts > 0 && <span className="ml-2">· best so far {Math.round(data.bestScore * 100)}%</span>}
              </p>
              <div className="mt-2 h-2 border-2 border-studio-ink" aria-hidden="true">
                <div className="h-full bg-studio-ink" style={{ width: `${total ? Math.round((answered / total) * 100) : 0}%` }} />
              </div>
            </div>

            <div className="k-cards-lg">
              {data.exercises.map((ex, i) => (
                <ExercisePlayer
                  key={`${round}-${ex.id}`}
                  exercise={{ ...ex, bestScore: null }}
                  token={token ?? ""}
                  index={i + 1}
                  total={total}
                  onChecked={() => {}}
                  test={{ onAnswer, frozen: busy }}
                />
              ))}
            </div>

            <div className="mt-10 border-t border-studio-ink pt-6">
              <button
                type="button"
                onClick={submit}
                disabled={busy || answered < total}
                className={`${btn} w-full bg-studio-ink text-white hover:border-signal hover:bg-signal disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto`}
              >
                {busy ? "Grading…" : "Submit the test"}
              </button>
              {answered < total && <p className="mt-3 text-xs text-studio-ink opacity-70">Answer every question to submit ({total - answered} left).</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PromptSchoolLevelTestPage() {
  return (
    <PremiumGuard accessKey="hasPromptSchoolAccess">
      <LevelTest />
      <BookPopup />
    </PremiumGuard>
  );
}
