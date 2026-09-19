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
import { CelebrationOverlay } from "@/components/rewards/CelebrationOverlay";
import { ConfettiSystem } from "@/components/rewards/ConfettiSystem";
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
  const [confettiActive, setConfettiActive] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

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
      const data: { score: number; passed: boolean } = await res.json();
      setResult(data);
      if (data.passed) setConfettiActive(true);
    } catch {
      setError("Failed to submit the quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  if (loading) return <p className="p-12 text-center text-sm text-black opacity-60">Loading…</p>;

  if (error) {
    return (
      <div className="min-h-dvh bg-white px-4 py-12">
        <p className="mx-auto max-w-2xl border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-2xl xl:max-w-3xl">
        <Link
          href="/university"
          className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          ← University
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Chapter Quiz</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tighter text-black">
          Check Your Understanding
        </h1>
        <p className="mt-2 text-sm text-black">Answer all {questions.length} questions. 4 of 5 correct to pass.</p>

        <div className="mt-10 space-y-10">
          {questions.map((q, i) => (
            <div key={q.id}>
              <p className="text-sm font-bold text-black">
                {i + 1}. {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex cursor-pointer items-center gap-3 border-2 p-3 text-sm text-black transition-colors duration-150 ease-out ${
                      answers[q.id] === optIndex ? "border-[#FF3000] bg-[#F2F2F2]" : "border-black"
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
          <div className={`mt-10 border-4 p-6 text-center ${result.passed ? "border-black" : "border-[#FF3000]"}`}>
            <p className="text-2xl font-black uppercase tracking-tight text-black">
              {result.score} / {questions.length}
            </p>
            <p className="mt-2 text-sm text-black">
              {result.passed ? "Passed, the next chapter is now unlocked." : "Not this time, try again."}
            </p>
            {!result.passed && (
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
                className="mt-6 inline-flex h-12 items-center justify-center border-4 border-black bg-black px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
              >
                Retry Quiz
              </button>
            )}
            {result.passed && (
              <Link
                href="/university"
                className="mt-6 inline-flex h-12 items-center justify-center border-4 border-black bg-black px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
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
            className="mt-10 h-14 w-full border-4 border-black bg-black text-sm font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        )}
      </div>
      <ConfettiSystem active={confettiActive} onDone={() => setConfettiActive(false)} />
      {result?.passed && !celebrationDismissed && (
        <CelebrationOverlay
          open={true}
          title="Chapter Passed"
          subtitle="Excellent progress. The next chapter is unlocked."
          onDismiss={() => setCelebrationDismissed(true)}
        />
      )}
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
