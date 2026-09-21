"use client";

/**
 * One Prompt School exercise, for all five kinds (choice, fill, order, spot, repair). It shows only the
 * public part it is given, sends the attempt to the server and shows the graded result, the explanation
 * and the correct answer that come back. Nothing is graded in the browser, so the answers never
 * reach it before an attempt. Layout is fluid, every control is at least 44 px, ordering uses Up and
 * Down buttons (no drag, so it works with touch, keyboard and screen readers alike).
 */

import { useEffect, useId, useRef, useState } from "react";
import { useRewards, type ServerReward } from "@/components/rewards/RewardsProvider";
import { MAX_REPAIR_LENGTH, splitTemplate, type ChoicePublic, type ExerciseKind, type FillPublic, type OrderPublic, type RepairPublic, type SpotPublic } from "@/features/prompt-school/domain";

export interface PublicExercise {
  id: string;
  kind: ExerciseKind;
  title: string;
  promptText: string;
  public: unknown;
  bestScore: number | null;
}

interface CheckResult {
  score: number;
  passed: boolean;
  feedback: Array<{ label: string; ok: boolean; hint?: string }>;
  reveal: Record<string, unknown>;
  explanation: string;
  bestScore: number;
  attempts: number;
  /** Coins paid by the server for this attempt (PDL-072); null when nothing was paid. */
  reward?: ServerReward | null;
  chapterReward?: ServerReward | null;
}

interface Props {
  exercise: PublicExercise;
  token: string;
  index: number;
  total: number;
  onChecked: (exerciseId: string, bestScore: number) => void;
  /**
   * Test mode (level tests): nothing is checked per question. The player reports the current answer up
   * (null while it is incomplete) and shows no result; `frozen` locks the inputs once the test is submitted.
   */
  test?: { onAnswer: (exerciseId: string, answer: unknown | null) => void; frozen: boolean };
}

const btn = "k-cbtn";

export function ExercisePlayer({ exercise, token, index, total, onChecked, test }: Props) {
  const { applyReward } = useRewards();
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attempt state for each kind.
  const [choice, setChoice] = useState<number | null>(null);
  const [fill, setFill] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>(() =>
    exercise.kind === "order" ? (exercise.public as OrderPublic).blocks.map((b) => b.id) : [],
  );
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState(() => (exercise.kind === "repair" ? (exercise.public as RepairPublic).starter : ""));

  function currentAnswer(): unknown {
    switch (exercise.kind) {
      case "choice":
        return { index: choice };
      case "fill":
        return { values: fill };
      case "order":
        return { order };
      case "spot":
        return { picked };
      case "repair":
        return { text };
    }
  }

  function ready(): boolean {
    switch (exercise.kind) {
      case "choice":
        return choice !== null;
      case "fill":
        return (exercise.public as FillPublic).blanks.every((b) => fill[b.id]);
      case "order":
        return true;
      case "spot":
        return true;
      case "repair":
        return text.trim().length > 0;
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prompt-school/exercises/${exercise.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ answer: currentAnswer() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CheckResult;
      setResult(data);
      onChecked(exercise.id, data.bestScore);
      applyReward([data.reward, data.chapterReward]);
    } catch {
      setError("Could not check your answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setResult(null);
    setError(null);
  }

  const locked = test ? test.frozen : result !== null;

  // The result replaces the button, but on a small screen a long exercise can still leave it just out of view.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [result]);

  useEffect(() => {
    if (!test) return;
    test.onAnswer(exercise.id, ready() ? currentAnswer() : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, fill, order, picked, text]);

  return (
    <section className="k-card p-4 sm:p-6" aria-labelledby={`ex-${exercise.id}`}>
      <p className="mb-1 text-studio-blueberry k-clabel">
        {test ? "Question" : "Exercise"} {index} of {total}: {kindLabel(exercise.kind)}
        {!test && exercise.bestScore !== null && (
          <span className="ml-2 text-studio-ink">Best {Math.round(exercise.bestScore * 100)}%</span>
        )}
      </p>
      <h2 id={`ex-${exercise.id}`} className="mb-3 text-studio-ink k-h4">
        {exercise.title}
      </h2>
      <p className="mb-5 text-sm leading-relaxed text-studio-ink">{exercise.promptText}</p>

      {exercise.kind === "choice" && (
        <ChoiceInput pub={exercise.public as ChoicePublic} value={choice} onChange={setChoice} locked={locked} reveal={result?.reveal} />
      )}
      {exercise.kind === "fill" && (
        <FillInput pub={exercise.public as FillPublic} values={fill} onChange={setFill} locked={locked} reveal={result?.reveal} />
      )}
      {exercise.kind === "order" && (
        <OrderInput pub={exercise.public as OrderPublic} order={order} onChange={setOrder} locked={locked} reveal={result?.reveal} />
      )}
      {exercise.kind === "spot" && (
        <SpotInput pub={exercise.public as SpotPublic} picked={picked} onChange={setPicked} locked={locked} reveal={result?.reveal} />
      )}
      {exercise.kind === "repair" && (
        <RepairInput pub={exercise.public as RepairPublic} value={text} onChange={setText} locked={locked} />
      )}

      {error && (
        <p role="alert" className="mt-4 k-card-sm border-signal p-3 text-sm text-signal">
          {error}
        </p>
      )}

      {!locked && !test && (
        <button
          type="button"
          onClick={submit}
          disabled={busy || !ready()}
          className={`${btn} k-cbtn-primary mt-5 w-full sm:w-auto`}
        >
          {busy ? "Checking…" : "Check answer"}
        </button>
      )}

      {result && !test && (
        <div ref={resultRef} className="mt-5 scroll-mt-32" role="status" aria-live="polite">
          <p className={`mb-3 border-l-8 py-1 pl-3 k-clabel ${result.passed ? "border-studio-ink text-studio-ink" : "border-signal text-signal"}`}>
            {result.passed ? "Passed" : "Not yet"}: {Math.round(result.score * 100)}%
            <span className="ml-2 font-bold normal-case tracking-normal">(attempt {result.attempts}, best {Math.round(result.bestScore * 100)}%)</span>
            {(result.reward?.coinsAwarded || result.chapterReward?.coinsAwarded) ? (
              <span className="ml-2 inline-block border-2 border-studio-ink bg-studio-lemon px-2 py-0.5 text-xs font-black normal-case tracking-normal text-studio-ink">
                +{(result.reward?.coinsAwarded ?? 0) + (result.chapterReward?.coinsAwarded ?? 0)} Vibe Coins
              </span>
            ) : null}
          </p>
          <ul className="mb-4 space-y-2 text-sm text-studio-ink">
            {result.feedback.map((f, i) => (
              <li key={`${f.label}-${i}`} className="flex gap-2">
                <span aria-hidden="true" className={`font-black ${f.ok ? "" : "text-signal"}`}>{f.ok ? "✓" : "✗"}</span>
                <span>
                  <span className="sr-only">{f.ok ? "Met: " : "Missed: "}</span>
                  {f.label}
                  {f.hint && <span className="block opacity-70">{f.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mb-4 k-card-sm bg-studio-canvas p-3 text-sm leading-relaxed text-studio-ink">
            <p className="mb-1 k-clabel">Why</p>
            {result.explanation}
          </div>
          {exercise.kind === "repair" && typeof result.reveal.model === "string" && (
            <div className="mb-4">
              <p className="mb-1 text-studio-ink k-clabel">A strong rewrite</p>
              <pre className="whitespace-pre-wrap break-words k-card-sm p-3 font-mono text-xs leading-relaxed text-studio-ink">{result.reveal.model}</pre>
            </div>
          )}
          <button
            type="button"
            onClick={retry}
            className={`${btn} w-full sm:w-auto`}
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}

function kindLabel(kind: ExerciseKind): string {
  return { choice: "choose", fill: "fill in the blanks", order: "put in order", spot: "spot the flaw", repair: "repair the prompt" }[kind];
}

// ---------- inputs ----------

function ChoiceInput({ pub, value, onChange, locked, reveal }: { pub: ChoicePublic; value: number | null; onChange: (n: number) => void; locked: boolean; reveal?: Record<string, unknown> }) {
  const correct = typeof reveal?.correctIndex === "number" ? reveal.correctIndex : null;
  return (
    <div role="radiogroup" className="space-y-2">
      {pub.options.map((opt, i) => {
        const selected = value === i;
        const isCorrect = locked && correct === i;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => onChange(i)}
            className={`flex min-h-11 w-full items-start gap-3 rounded-xl border-2 px-3 py-2 text-left text-[0.8125rem] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal ${
              selected ? "border-studio-ink bg-studio-blueberry text-white" : "border-studio-ink bg-studio-paper text-studio-ink hover:bg-studio-lemon"
            } ${locked ? "cursor-default" : ""}`}
          >
            <span aria-hidden="true" className="font-black">{String.fromCharCode(65 + i)}</span>
            <span className="min-w-0 flex-1 break-words">{opt}</span>
            {isCorrect && <span className="shrink-0 k-clabel">Correct</span>}
          </button>
        );
      })}
    </div>
  );
}

function FillInput({ pub, values, onChange, locked, reveal }: { pub: FillPublic; values: Record<string, string>; onChange: (v: Record<string, string>) => void; locked: boolean; reveal?: Record<string, unknown> }) {
  const uid = useId();
  const correct = (reveal?.correct ?? null) as Record<string, string> | null;
  const parts = splitTemplate(pub.template);
  const blanks = new Map(pub.blanks.map((b) => [b.id, b]));
  return (
    <div className="whitespace-pre-wrap break-words k-card-sm p-3 font-mono text-xs leading-loose text-studio-ink sm:text-sm">
      {parts.map((p, i) => {
        if ("text" in p) return <span key={i}>{p.text}</span>;
        const blank = blanks.get(p.blank);
        if (!blank) return null;
        const right = correct ? values[blank.id] === correct[blank.id] : null;
        return (
          <span key={i} className="inline-block max-w-full align-middle">
            <label className="sr-only" htmlFor={`${uid}-${blank.id}`}>Blank {blank.id}</label>
            <select
              id={`${uid}-${blank.id}`}
              value={values[blank.id] ?? ""}
              disabled={locked}
              onChange={(e) => onChange({ ...values, [blank.id]: e.target.value })}
              className={`mx-1 min-h-11 max-w-full rounded-lg border-2 bg-studio-paper px-2 py-1 font-mono text-xs font-bold text-studio-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal sm:text-sm ${
                right === null ? "border-studio-ink" : right ? "border-studio-ink" : "border-signal"
              }`}
            >
              <option value="">Choose…</option>
              {blank.choices.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {correct && right === false && (
              <span className="mr-1 text-xs font-bold text-signal">(correct: {correct[blank.id]})</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function OrderInput({ pub, order, onChange, locked, reveal }: { pub: OrderPublic; order: string[]; onChange: (o: string[]) => void; locked: boolean; reveal?: Record<string, unknown> }) {
  const text = new Map(pub.blocks.map((b) => [b.id, b.text]));
  const correct = Array.isArray(reveal?.order) ? (reveal.order as string[]) : null;
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  }
  return (
    <ol className="space-y-2">
      {order.map((id, i) => {
        const inPlace = correct ? correct[i] === id : null;
        return (
          <li key={id} className={`flex items-stretch gap-2 overflow-hidden rounded-xl border-2 ${inPlace === false ? "border-signal" : "border-studio-ink"}`}>
            <span aria-hidden="true" className="flex w-9 shrink-0 items-center justify-center bg-studio-ink text-sm font-black text-white">{i + 1}</span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words py-2 text-sm text-studio-ink">{text.get(id)}</span>
            {!locked && (
              <span className="flex shrink-0 flex-col border-l border-studio-ink">
                <button type="button" aria-label={`Move up: ${text.get(id)?.slice(0, 40)}`} disabled={i === 0} onClick={() => move(i, i - 1)} className="flex min-h-11 min-w-11 flex-1 items-center justify-center text-studio-ink hover:text-signal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-signal disabled:opacity-30">▲</button>
                <button type="button" aria-label={`Move down: ${text.get(id)?.slice(0, 40)}`} disabled={i === order.length - 1} onClick={() => move(i, i + 1)} className="flex min-h-11 min-w-11 flex-1 items-center justify-center border-t border-studio-ink text-studio-ink hover:text-signal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-signal disabled:opacity-30">▼</button>
              </span>
            )}
          </li>
        );
      })}
      {correct && (
        <li className="list-none pt-2 text-xs text-studio-ink">
          <span className="k-clabel">Correct order: </span>
          {correct.map((id) => (text.get(id) ?? "").slice(0, 28).trim()).join(", ")}
        </li>
      )}
    </ol>
  );
}

function SpotInput({ pub, picked, onChange, locked, reveal }: { pub: SpotPublic; picked: string[]; onChange: (p: string[]) => void; locked: boolean; reveal?: Record<string, unknown> }) {
  const flawed = Array.isArray(reveal?.flawed) ? new Set(reveal.flawed as string[]) : null;
  return (
    <div className="space-y-2">
      <p className="text-studio-ink k-clabel">{pub.pickPrompt ?? "Select every weak line"}</p>
      {pub.segments.map((s) => {
        const on = picked.includes(s.id);
        const wasFlawed = flawed ? flawed.has(s.id) : null;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={on}
            disabled={locked}
            onClick={() => onChange(on ? picked.filter((p) => p !== s.id) : [...picked, s.id])}
            className={`flex min-h-11 w-full items-start gap-3 rounded-xl border-2 px-3 py-2 text-left text-[0.8125rem] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal ${
              on ? "border-studio-ink bg-studio-blueberry text-white" : "border-studio-ink bg-studio-paper text-studio-ink hover:bg-studio-lemon"
            } ${locked ? "cursor-default" : ""}`}
          >
            <span aria-hidden="true" className="font-black">{on ? "■" : "□"}</span>
            <span className="min-w-0 flex-1 break-words">{s.text}</span>
            {wasFlawed !== null && (
              <span className={`shrink-0 k-clabel ${on ? "" : wasFlawed ? "text-signal" : ""}`}>
                {wasFlawed ? (pub.hitLabel ?? "Flawed") : (pub.missLabel ?? "Fine")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function RepairInput({ pub, value, onChange, locked }: { pub: RepairPublic; value: string; onChange: (v: string) => void; locked: boolean }) {
  const uid = useId();
  return (
    <div>
      {pub.hint && <p className="mb-2 border-l border-signal pl-3 text-xs text-studio-ink">{pub.hint}</p>}
      <label htmlFor={`${uid}-repair`} className="mb-1 block text-studio-ink k-clabel">Your rewritten prompt</label>
      <textarea
        id={`${uid}-repair`}
        value={value}
        disabled={locked}
        maxLength={MAX_REPAIR_LENGTH}
        rows={10}
        onChange={(e) => onChange(e.target.value)}
        className="block min-h-48 w-full resize-y k-card p-3 font-mono text-xs leading-relaxed text-studio-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal sm:text-sm"
      />
      <p className="mt-1 text-right text-xs text-studio-ink opacity-60">{value.length} / {MAX_REPAIR_LENGTH}</p>
    </div>
  );
}
