/**
 * "Try it live" panel of a Prompt School lesson (PDL-077). The learner writes their own prompt, the server runs it on a real
 * model against the task's fixed sample input, and the reply appears as plain text next to a self-check list. A run is never
 * graded and pays nothing; three runs a day per learner. Only lessons with a sandbox task get this panel.
 */

"use client";

import { useId, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { SANDBOX_INPUT_MARKER, SANDBOX_MAX_PROMPT_CHARS, SANDBOX_MIN_PROMPT_CHARS } from "@/features/prompt-school/sandbox-limits";

export interface SandboxData {
  task: { id: string; title: string; brief: string; sampleInput: string; starter: string | null };
  runsLeft: number;
  dailyCap: number;
}

interface RunResult {
  reply: string;
  checklist: string[];
}

export function SandboxPanel({ chapterSlug, lessonSlug, sandbox }: { chapterSlug: string; lessonSlug: string; sandbox: SandboxData }) {
  const uid = useId();
  const { token } = useSession();
  const [prompt, setPrompt] = useState(sandbox.task.starter ?? "");
  const [left, setLeft] = useState(sandbox.runsLeft);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  const tooShort = prompt.trim().length < SANDBOX_MIN_PROMPT_CHARS;

  async function run() {
    if (!token || running || left <= 0 || tooShort) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/prompt-school/sandbox/${chapterSlug}/${lessonSlug}`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const body = (await res.json().catch(() => ({}))) as { reply?: string; runsLeft?: number; checklist?: string[]; error?: string };
      if (!res.ok || typeof body.reply !== "string") {
        if (res.status === 429) setLeft(0);
        setError(body.error ?? "The run failed. Please try again.");
        return;
      }
      setLeft(body.runsLeft ?? Math.max(0, left - 1));
      setResult({ reply: body.reply, checklist: body.checklist ?? [] });
    } catch {
      setError("The run failed. Please check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section aria-labelledby={`${uid}-title`} className="mt-10 k-card p-4 sm:p-6">
      <p className="mb-1 text-studio-blueberry k-clabel">Try it live</p>
      <h2 id={`${uid}-title`} className="break-words text-studio-ink k-cheading">{sandbox.task.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-studio-ink">{sandbox.task.brief}</p>

      <p className="mb-1 mt-5 text-studio-ink k-clabel">The sample input</p>
      <pre className="k-card-sm max-h-56 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed text-studio-ink sm:text-sm">{sandbox.task.sampleInput}</pre>

      <label htmlFor={`${uid}-prompt`} className="mb-1 mt-5 block text-studio-ink k-clabel">Your prompt</label>
      <p className="mb-2 text-xs text-studio-ink opacity-70">
        Write <code className="font-mono">{SANDBOX_INPUT_MARKER}</code> where the sample input should go. Without it, the sample is added after your prompt.
      </p>
      <textarea
        id={`${uid}-prompt`}
        value={prompt}
        maxLength={SANDBOX_MAX_PROMPT_CHARS}
        rows={8}
        onChange={(e) => setPrompt(e.target.value)}
        className="block min-h-40 w-full resize-y k-card p-3 font-mono text-xs leading-relaxed text-studio-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal sm:text-sm"
      />
      <p className="mt-1 text-right text-xs text-studio-ink opacity-60">{prompt.length} / {SANDBOX_MAX_PROMPT_CHARS}</p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={run}
          disabled={running || left <= 0 || tooShort}
          className="inline-flex min-h-11 w-full items-center justify-center disabled:opacity-40 sm:w-auto k-cbtn k-cbtn-primary"
        >
          {running ? "Running…" : "Run my prompt"}
        </button>
        <p className="text-xs text-studio-ink" aria-live="polite">
          {left > 0 ? `${left} of ${sandbox.dailyCap} runs left today` : "No runs left today, they come back tomorrow."}
        </p>
      </div>
      <p className="mt-2 text-xs text-studio-ink opacity-60">A run is practice only: it is not graded and does not change your progress or coins.</p>

      {error && <p role="alert" className="mt-4 k-card-sm border-signal p-3 text-sm text-signal">{error}</p>}

      {result && (
        <div className="mt-6" aria-live="polite">
          <p className="mb-1 text-studio-ink k-clabel">What the model answered</p>
          <div className="k-card-sm whitespace-pre-wrap break-words p-3 text-sm leading-relaxed text-studio-ink">{result.reply}</div>
          {result.checklist.length > 0 && (
            <>
              <p className="mb-1 mt-5 text-studio-ink k-clabel">Check it yourself</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-studio-ink">
                {result.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-studio-ink opacity-60">If it missed, change one thing in your prompt and run again.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
