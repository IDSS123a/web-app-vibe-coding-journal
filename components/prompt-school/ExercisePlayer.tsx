"use client";

/**
 * One Prompt School exercise, for all five kinds (choice, fill, order, spot, repair). It shows only the
 * public part it is given, sends the attempt to the server and shows the graded result, the explanation
 * and the correct answer that come back. Nothing is graded in the browser, so the answers never
 * reach it before an attempt. Layout is fluid, every control is at least 44 px, ordering uses Up and
 * Down buttons (no drag, so it works with touch, keyboard and screen readers alike).
 */

import { useId, useState } from "react";
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
}

interface Props {
  exercise: PublicExercise;
  token: string;
  index: number;
  total: number;
  onChecked: (exerciseId: string, bestScore: number) => void;
}

const btn =
  "inline-flex min-h-11 items-center justify-center border-4 border-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-150 ease-out focus-visible:outline-none";

export function ExercisePlayer({ exercise, token, index, total, onChecked }: Props) {
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

  const locked = result !== null;

  return (
    <section className="border-4 border-black p-4 sm:p-6" aria-labelledby={`ex-${exercise.id}`}>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
        Exercise {index} of {total}: {kindLabel(exercise.kind)}
        {exercise.bestScore !== null && (
          <span className="ml-2 text-black">Best {Math.round(exercise.bestScore * 100)}%</span>
        )}
      </p>
      <h2 id={`ex-${exercise.id}`} className="mb-3 text-xl font-black uppercase tracking-tight text-black">
        {exercise.title}
      </h2>
      <p className="mb-5 text-sm leading-relaxed text-black">{exercise.promptText}</p>

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
        <p role="alert" className="mt-4 border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">
          {error}
        </p>
      )}

      {!locked && (
        <button
          type="button"
          onClick={submit}
          disabled={busy || !ready()}
          className={`${btn} mt-5 w-full bg-black text-white hover:border-[#FF3000] hover:bg-[#FF3000] focus-visible:ring-4 focus-visible:ring-[#FF3000] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto`}
        >
          {busy ? "Checking…" : "Check answer"}
        </button>
      )}

      {result && (
        <div className="mt-5" role="status" aria-live="polite">
          <p className={`mb-3 border-l-8 py-1 pl-3 text-sm font-black uppercase tracking-tight ${result.passed ? "border-black text-black" : "border-[#FF3000] text-[#FF3000]"}`}>
            {result.passed ? "Passed" : "Not yet"}: {Math.round(result.score * 100)}%
            <span className="ml-2 font-bold normal-case tracking-normal">(attempt {result.attempts}, best {Math.round(result.bestScore * 100)}%)</span>
          </p>
          <ul className="mb-4 space-y-2 text-sm text-black">
            {result.feedback.map((f, i) => (
              <li key={`${f.label}-${i}`} className="flex gap-2">
                <span aria-hidden="true" className={`font-black ${f.ok ? "" : "text-[#FF3000]"}`}>{f.ok ? "✓" : "✗"}</span>
                <span>
                  <span className="sr-only">{f.ok ? "Met: " : "Missed: "}</span>
                  {f.label}
                  {f.hint && <span className="block opacity-70">{f.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mb-4 border-2 border-black bg-[#F2F2F2] p-3 text-sm leading-relaxed text-black">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest">Why</p>
            {result.explanation}
          </div>
          {exercise.kind === "repair" && typeof result.reveal.model === "string" && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-black">A strong rewrite</p>
              <pre className="whitespace-pre-wrap break-words border-2 border-black p-3 font-mono text-xs leading-relaxed text-black">{result.reveal.model}</pre>
            </div>
          )}
          <button
            type="button"
            onClick={retry}
            className={`${btn} w-full bg-white text-black hover:border-[#FF3000] hover:text-[#FF3000] focus-visible:ring-4 focus-visible:ring-[#FF3000] sm:w-auto`}
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
            className={`flex min-h-11 w-full items-start gap-3 border-4 px-3 py-2 text-left text-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] ${
              selected ? "border-black bg-black text-white" : "border-black bg-white text-black hover:border-[#FF3000]"
            } ${locked ? "cursor-default" : ""}`}
          >
            <span aria-hidden="true" className="font-black">{String.fromCharCode(65 + i)}</span>
            <span className="min-w-0 flex-1 break-words">{opt}</span>
            {isCorrect && <span className="shrink-0 text-xs font-bold uppercase tracking-widest">Correct</span>}
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
    <div className="whitespace-pre-wrap break-words border-2 border-black p-3 font-mono text-xs leading-loose text-black sm:text-sm">
      {parts.map((p, i) => {
        if ("text" in p) return <span key={i}>{p.text}</span>;
        const blank = blanks.get(p.blank);
        if (!blank) return null;
        const right = correct ? values[blank.id] === correct[blank.id] : null;
        return (
          <span key={i} className="inline-block align-middle">
            <label className="sr-only" htmlFor={`${uid}-${blank.id}`}>Blank {blank.id}</label>
            <select
              id={`${uid}-${blank.id}`}
              value={values[blank.id] ?? ""}
              disabled={locked}
              onChange={(e) => onChange({ ...values, [blank.id]: e.target.value })}
              className={`mx-1 min-h-11 max-w-full border-4 bg-white px-2 py-1 font-mono text-xs font-bold text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] sm:text-sm ${
                right === null ? "border-black" : right ? "border-black" : "border-[#FF3000]"
              }`}
            >
              <option value="">Choose…</option>
              {blank.choices.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {correct && right === false && (
              <span className="mr-1 text-xs font-bold text-[#FF3000]">(correct: {correct[blank.id]})</span>
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
          <li key={id} className={`flex items-stretch gap-2 border-4 ${inPlace === false ? "border-[#FF3000]" : "border-black"}`}>
            <span aria-hidden="true" className="flex w-9 shrink-0 items-center justify-center bg-black text-sm font-black text-white">{i + 1}</span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words py-2 text-sm text-black">{text.get(id)}</span>
            {!locked && (
              <span className="flex shrink-0 flex-col border-l-4 border-black">
                <button type="button" aria-label={`Move up: ${text.get(id)?.slice(0, 40)}`} disabled={i === 0} onClick={() => move(i, i - 1)} className="flex min-h-11 min-w-11 flex-1 items-center justify-center text-black hover:text-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#FF3000] disabled:opacity-30">▲</button>
                <button type="button" aria-label={`Move down: ${text.get(id)?.slice(0, 40)}`} disabled={i === order.length - 1} onClick={() => move(i, i + 1)} className="flex min-h-11 min-w-11 flex-1 items-center justify-center border-t-4 border-black text-black hover:text-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#FF3000] disabled:opacity-30">▼</button>
              </span>
            )}
          </li>
        );
      })}
      {correct && (
        <li className="list-none pt-2 text-xs text-black">
          <span className="font-bold uppercase tracking-widest">Correct order: </span>
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
      <p className="text-xs font-bold uppercase tracking-widest text-black">Select every weak line</p>
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
            className={`flex min-h-11 w-full items-start gap-3 border-4 px-3 py-2 text-left text-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] ${
              on ? "border-black bg-black text-white" : "border-black bg-white text-black hover:border-[#FF3000]"
            } ${locked ? "cursor-default" : ""}`}
          >
            <span aria-hidden="true" className="font-black">{on ? "■" : "□"}</span>
            <span className="min-w-0 flex-1 break-words">{s.text}</span>
            {wasFlawed !== null && (
              <span className={`shrink-0 text-xs font-bold uppercase tracking-widest ${on ? "" : wasFlawed ? "text-[#FF3000]" : ""}`}>
                {wasFlawed ? "Flawed" : "Fine"}
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
      {pub.hint && <p className="mb-2 border-l-4 border-[#FF3000] pl-3 text-xs text-black">{pub.hint}</p>}
      <label htmlFor={`${uid}-repair`} className="mb-1 block text-xs font-bold uppercase tracking-widest text-black">Your rewritten prompt</label>
      <textarea
        id={`${uid}-repair`}
        value={value}
        disabled={locked}
        maxLength={MAX_REPAIR_LENGTH}
        rows={10}
        onChange={(e) => onChange(e.target.value)}
        className="block min-h-48 w-full resize-y border-4 border-black bg-white p-3 font-mono text-xs leading-relaxed text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] sm:text-sm"
      />
      <p className="mt-1 text-right text-xs text-black opacity-60">{value.length} / {MAX_REPAIR_LENGTH}</p>
    </div>
  );
}
