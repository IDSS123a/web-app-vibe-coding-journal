/**
 * Level final test — Premium-only. Cumulative test unlocked once
 * every chapter in a level is passed (specs/vibe-coding-university/
 * SPEC.md Amendment). Same server-side-grading discipline as the
 * chapter quiz.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { CelebrationOverlay } from "@/components/rewards/CelebrationOverlay";
import { ConfettiSystem } from "@/components/rewards/ConfettiSystem";
import type { QuizQuestionPublic } from "@/lib/validation/schemas";

function LevelTest() {
  const params = useParams<{ level: string }>();
  const { token, loading: sessionLoading } = useSession();
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetch(`/api/university/level-test/${params.level}`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { questions: QuizQuestionPublic[] }) => setQuestions(d.questions))
      .catch(() => setError("Failed to load the level test."))
      .finally(() => setLoading(false));
  }, [token, sessionLoading, params.level]);

  async function submit() {
    if (!token || questions.length === 0) return;
    const payload = questions.map((q) => ({
      question_id: q.id,
      selected_option_index: answers[q.id] ?? -1,
    }));
    setSubmitting(true);
    try {
      const res = await fetch(`/api/university/level-test/${params.level}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: payload }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { score: number; total: number; passed: boolean } = await res.json();
      setResult(data);
      if (data.passed) setConfettiActive(true);
    } catch {
      setError("Failed to submit the test.");
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  if (loading) return <p className="p-12 text-center text-sm text-black opacity-60">Loading…</p>;

  if (error || (!loading && questions.length === 0)) {
    return (
      <div className="min-h-screen bg-white px-4 py-12">
        <p className="mx-auto max-w-2xl border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">
          {error ?? "This level's final test isn't available yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-2xl">
        <a
          href="/university"
          className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          ← University
        </a>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
          {params.level} — Final Test
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tighter text-black">
          Level Final Test
        </h1>
        <p className="mt-2 text-sm text-black">
          Answer all {questions.length} questions. 80% correct to pass this level.
        </p>

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
              {result.score} / {result.total}
            </p>
            <p className="mt-2 text-sm text-black">
              {result.passed
                ? `You've completed the ${params.level} level.`
                : "Not this time — review the chapters and try again."}
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
                Retry Test
              </button>
            )}
            {result.passed && (
              <a
                href="/university"
                className="mt-6 inline-flex h-12 items-center justify-center border-4 border-black bg-black px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
              >
                Back to University
              </a>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="mt-10 h-14 w-full border-4 border-black bg-black text-sm font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Final Test"}
          </button>
        )}
      </div>
      <ConfettiSystem active={confettiActive} onDone={() => setConfettiActive(false)} />
      {result?.passed && !celebrationDismissed && (
        <CelebrationOverlay
          open={true}
          title={`Level Complete: ${typeof params.level === "string" ? params.level : ""}`}
          subtitle="Outstanding work. You've cleared the entire level."
          onDismiss={() => setCelebrationDismissed(true)}
        />
      )}
    </div>
  );
}

export default function LevelTestPage() {
  return (
    <PremiumGuard>
      <LevelTest />
    </PremiumGuard>
  );
}
