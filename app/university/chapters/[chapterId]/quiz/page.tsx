/**
 * Chapter quiz — Premium-only. 5 multiple-choice questions, 4/5 to
 * pass (specs/vibe-coding-university/SPEC.md Amendment). Grading
 * happens server-side (POST /api/university/chapters/[id]/quiz) --
 * this page never sees the answer key.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { useRewards, type NewBadge, type ServerReward } from "@/components/rewards/RewardsProvider";
import type { QuizQuestionPublic } from "@/lib/validation/schemas";

function ChapterQuiz() {
  const params = useParams<{ chapterId: string }>();
  const { token, loading: sessionLoading } = useSession();
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const { applyReward, sparkle } = useRewards();

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetch(`/api/university/chapters/${params.chapterId}/quiz`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { questions: QuizQuestionPublic[] }) => setQuestions(d.questions))
      .catch(() => setError("Failed to load the quiz."))
      .finally(() => setLoading(false));
  }, [token, sessionLoading, params.chapterId]);

  async function submit() {
    if (!token || questions.length === 0) return;
    const payload = questions.map((q) => ({
      question_id: q.id,
      selected_option_index: answers[q.id] ?? -1,
    }));
    setSubmitting(true);
    try {
      const res = await fetch(`/api/university/chapters/${params.chapterId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: payload }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { score: number; passed: boolean; reward?: ServerReward | null; badges?: NewBadge[] } = await res.json();
      setResult({ score: data.score, passed: data.passed });
      // Coins and badges are paid by the server (PDL-075); a repeat pass pays nothing and just sparkles.
      if (data.passed) {
        if ((data.reward?.coinsAwarded ?? 0) > 0 || (data.badges?.length ?? 0) > 0) applyReward([data.reward], data.badges);
        else sparkle();
      }
    } catch {
      setError("Failed to submit the quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  if (loading) return <p className="p-12 text-center text-sm text-studio-ink opacity-60">Loading…</p>;

  if (error) {
    return (
      <div className="k-page layer-campus">
        <p className="mx-auto max-w-2xl k-card-sm border-signal p-3 text-sm text-signal">{error}</p>
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
        <p className="mt-6 text-studio-blueberry k-clabel">Chapter Quiz</p>
        <h1 className="mt-2 text-studio-ink k-cheading">
          Check Your Understanding
        </h1>
        <p className="mt-2 text-sm text-studio-ink">Answer all {questions.length} questions. 4 of 5 correct to pass.</p>

        <div className="mt-10 space-y-10">
          {questions.map((q, i) => (
            <div key={q.id}>
              <p className="text-sm font-bold text-studio-ink">
                {i + 1}. {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex cursor-pointer items-center gap-3 k-card-sm p-3 text-sm text-studio-ink transition-colors duration-150 ease-out ${
                      answers[q.id] === optIndex ? "border-signal bg-studio-canvas" : "border-studio-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === optIndex}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIndex }))}
                      className="h-4 w-4 shrink-0"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {result ? (
          <div className={`mt-10 k-card p-6 text-center ${result.passed ? "border-studio-ink" : "border-signal"}`}>
            <p className="text-studio-ink k-clabel">
              {result.score} / {questions.length}
            </p>
            <p className="mt-2 text-sm text-studio-ink">
              {result.passed ? "Passed, the next chapter is now unlocked." : "Not this time, try again."}
            </p>
            {!result.passed && (
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
                className="mt-6 inline-flex h-12 items-center justify-center k-cbtn k-cbtn-primary"
              >
                Retry Quiz
              </button>
            )}
            {result.passed && (
              <Link
                href="/university"
                className="mt-6 inline-flex h-12 items-center justify-center k-cbtn k-cbtn-primary"
              >
                Back to University
              </Link>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="mt-10 h-14 w-full disabled:cursor-not-allowed disabled:opacity-50 k-cbtn k-cbtn-primary"
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChapterQuizPage() {
  return (
    <PremiumGuard>
      <ChapterQuiz />
    </PremiumGuard>
  );
}
