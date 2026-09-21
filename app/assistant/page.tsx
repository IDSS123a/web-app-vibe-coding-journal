/**
 * Vibe-Coding Assistant (specs/prompt-blueprint-builder/, resolves
 * CONSTITUTION.md P-19, DECISION_LOG.md PDL-046). Premium-only
 * (PremiumGuard, hasAssistantAccess). A structured wizard (not free-form
 * chat, per the Director's explicit token-cost instruction) that turns
 * a vibe-coder's project idea into a copy-pasteable initial prompt for
 * Claude Code or a similar AI coding assistant, following the
 * Director's book's "Blueprint" format. Client-rendered like University
 * -- auth session lives in the browser.
 */

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { MarkdownContent } from "@/components/MarkdownContent";

interface WizardForm {
  projectDescription: string;
  projectType: string;
  projectTypeOtherText: string;
  targetUser: string;
  coreGoal: string;
  experienceLevel: string;
  techPreferences: string;
  noTechPreference: boolean;
  inspiration: string;
  constraints: string;
}

const EMPTY_FORM: WizardForm = {
  projectDescription: "",
  projectType: "web_app",
  projectTypeOtherText: "",
  targetUser: "",
  coreGoal: "",
  experienceLevel: "some_experience",
  techPreferences: "",
  noTechPreference: false,
  inspiration: "",
  constraints: "",
};

interface Generation {
  id: string;
  domain: string;
  scenario: string;
  goal: string;
  explanation: string;
  promptBlueprint: string;
  mermaidDiagram: string;
  nextSteps: string;
  createdAt: string;
}

interface GenerationSummary {
  id: string;
  domain: string;
  goal: string;
  createdAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => undefined);
      }}
      className="h-11 shrink-0 k-btn k-btn-primary"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function BlueprintResult({ generation }: { generation: Generation }) {
  return (
    <div className="mt-10 border border-black">
      <div className="border-b border-black bg-paper-2 p-6">
        <p className="text-signal k-label">{generation.domain}</p>
        <p className="mt-2 text-sm text-black">{generation.scenario}</p>
        <p className="mt-2 text-sm font-bold text-black">{generation.goal}</p>
      </div>

      <div className="border-b border-black p-6">
        <h3 className="mb-3 text-black k-label">Explanation</h3>
        <MarkdownContent className="text-black">{generation.explanation}</MarkdownContent>
      </div>

      <div className="border-b border-black p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-black k-label">
            Prompt Blueprint, copy this into Claude Code
          </h3>
          <CopyButton text={generation.promptBlueprint} />
        </div>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words bg-paper-2 p-4 font-mono text-xs text-black">
          {generation.promptBlueprint}
        </pre>
      </div>

      <div className="border-b border-black p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-black k-label">Flow Diagram (Mermaid)</h3>
          <CopyButton text={generation.mermaidDiagram} />
        </div>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words bg-paper-2 p-4 font-mono text-xs text-black">
          {generation.mermaidDiagram}
        </pre>
      </div>

      <div className="p-6">
        <h3 className="mb-3 text-black k-label">Suggested Next Steps</h3>
        <MarkdownContent className="text-black">{generation.nextSteps}</MarkdownContent>
      </div>
    </div>
  );
}

// A full Blueprint takes 20-40 s to generate. A button that only says
// "Generating…" for that long reads as a frozen page (Director's report,
// 2026-09-19: "the chatbot does not work"), so show what is happening, how long
// it has been, and that leaving the page loses the result.
const GENERATION_STAGES: { atSeconds: number; text: string }[] = [
  { atSeconds: 0, text: "Reading your answers…" },
  { atSeconds: 4, text: "Applying the prompt-engineering canon to your project…" },
  { atSeconds: 12, text: "Writing your Blueprint (this is the slow part)…" },
  { atSeconds: 30, text: "Still working, long Blueprints can take up to a minute…" },
  { atSeconds: 60, text: "Taking longer than usual. Hang on a little more…" },
];

function GeneratingStatus() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const stage = [...GENERATION_STAGES].reverse().find((s) => seconds >= s.atSeconds)!;
  return (
    <div role="status" aria-live="polite" className="border border-black p-4 text-sm text-black">
      <p className="font-bold">{stage.text}</p>
      <p className="mt-1 text-xs text-[#666]">
        {seconds}s elapsed, please keep this tab open; your Blueprint appears here and is saved to History.
      </p>
      <div className="mt-3 h-1 w-full overflow-hidden bg-rule" aria-hidden="true">
        <div className="h-full w-1/3 animate-pulse bg-signal" />
      </div>
    </div>
  );
}

function Wizard() {
  const { token } = useSession();
  const [view, setView] = useState<"new" | "history">("new");
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Generation | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // The result renders below a long form; without this the user finishes a
  // 30 s wait and sees nothing change on screen.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const [history, setHistory] = useState<GenerationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  function loadHistory() {
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError(null);
    fetch("/api/assistant/history", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { data: GenerationSummary[] }) => setHistory(d.data))
      .catch(() => setHistoryError("Failed to load history."))
      .finally(() => setHistoryLoading(false));
  }

  useEffect(() => {
    if (view === "history") loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, token]);

  function openHistoryItem(id: string) {
    if (!token) return;
    setError(null);
    setResult(null);
    setSubmitting(true);
    fetch(`/api/assistant/history/${id}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { data: Generation }) => {
        setResult(d.data);
        setView("new");
      })
      .catch(() => setError("Failed to load this generation."))
      .finally(() => setSubmitting(false));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setResult(null);

    const techPreferences = form.noTechPreference
      ? []
      : form.techPreferences
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    try {
      const res = await fetch("/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectDescription: form.projectDescription,
          projectType: form.projectType,
          projectTypeOtherText: form.projectType === "other" ? form.projectTypeOtherText : undefined,
          targetUser: form.targetUser,
          coreGoal: form.coreGoal,
          experienceLevel: form.experienceLevel,
          techPreferences,
          noTechPreference: form.noTechPreference,
          inspiration: form.inspiration || undefined,
          constraints: form.constraints || undefined,
        }),
      });
      // A gateway timeout or platform error can answer with an HTML page, not
      // JSON; that must not be reported as "network error".
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          data?.error ||
            "The service did not answer properly. Nothing was counted against your daily limit, please try again in a minute.",
        );
        return;
      }
      if (!data?.data) {
        setError("The service returned an empty answer. Nothing was counted against your daily limit, please try again.");
        return;
      }
      setResult(data.data as Generation);
    } catch {
      setError("Could not reach the server, check your internet connection and try again. Your answers are still in the form.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="k-page">
      <div className="mx-auto max-w-3xl xl:max-w-4xl">
        <div className="mb-10 border-b border-black pb-8">
          <p className="mb-2 text-signal k-label">Premium</p>
          <h1 className="text-black k-display">
            Vibe-Coding Assistant
          </h1>
          <p className="mt-2 text-sm text-black">
            Answer a few questions about the project you want to build. You&apos;ll get a
            ready-to-paste initial prompt for Claude Code, built using the prompt engineering
            techniques from the Director&apos;s book.
          </p>
        </div>

        <div className="mb-8 flex gap-0 border border-black">
          <button
            type="button"
            onClick={() => setView("new")}
            className={`h-12 flex-1 transition-colors duration-150 ease-out k-label ${
              view === "new" ? "bg-black text-white" : "bg-white text-black hover:bg-paper-2"
            }`}
          >
            New Prompt
          </button>
          <button
            type="button"
            onClick={() => setView("history")}
            className={`h-12 flex-1 border-l-4 border-black transition-colors duration-150 ease-out k-label ${
              view === "history" ? "bg-black text-white" : "bg-white text-black hover:bg-paper-2"
            }`}
          >
            History
          </button>
        </div>

        {view === "history" ? (
          <div>
            {historyLoading && <p className="text-sm text-black opacity-60">Loading…</p>}
            {historyError && <p className="border border-signal p-3 text-sm text-signal">{historyError}</p>}
            {!historyLoading && !historyError && history.length === 0 && (
              <p className="text-sm text-black opacity-60">No prompts generated yet.</p>
            )}
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openHistoryItem(item.id)}
                    className="block w-full border border-black p-4 text-left transition-colors duration-150 ease-out hover:border-signal"
                  >
                    <p className="text-signal k-label">{item.domain}</p>
                    <p className="mt-1 text-sm text-black">{item.goal}</p>
                    <p className="mt-2 text-xs text-black opacity-50">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Field label="What are you building? (one line)" required>
                <input
                  required
                  maxLength={200}
                  value={form.projectDescription}
                  onChange={(e) => setForm({ ...form, projectDescription: e.target.value })}
                  placeholder="e.g. A habit tracker for daily journaling"
                  className="h-11 w-full border border-black px-3 text-sm text-black"
                />
              </Field>

              <Field label="Project type" required>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                  className="h-11 w-full border border-black px-3 text-sm text-black"
                >
                  <option value="web_app">Web app</option>
                  <option value="mobile_app">Mobile app</option>
                  <option value="browser_extension">Browser extension</option>
                  <option value="cli_tool">CLI tool</option>
                  <option value="api_backend">API / backend service</option>
                  <option value="data_pipeline_automation">Data pipeline / automation</option>
                  <option value="other">Other</option>
                </select>
                {form.projectType === "other" && (
                  <input
                    maxLength={100}
                    value={form.projectTypeOtherText}
                    onChange={(e) => setForm({ ...form, projectTypeOtherText: e.target.value })}
                    placeholder="Describe the project type"
                    className="mt-2 h-11 w-full border border-black px-3 text-sm text-black"
                  />
                )}
              </Field>

              <Field label="Who is this for?" required>
                <input
                  required
                  maxLength={200}
                  value={form.targetUser}
                  onChange={(e) => setForm({ ...form, targetUser: e.target.value })}
                  placeholder="e.g. Myself, tracking a daily writing habit"
                  className="h-11 w-full border border-black px-3 text-sm text-black"
                />
              </Field>

              <Field label="What should the finished project actually do?" required>
                <textarea
                  required
                  maxLength={600}
                  rows={4}
                  value={form.coreGoal}
                  onChange={(e) => setForm({ ...form, coreGoal: e.target.value })}
                  placeholder="Describe the core functionality in a few sentences"
                  className="w-full border border-black px-3 py-2 text-sm text-black"
                />
              </Field>

              <Field label="Your experience level" required>
                <select
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                  className="h-11 w-full border border-black px-3 text-sm text-black"
                >
                  <option value="beginner">Complete beginner</option>
                  <option value="some_experience">Some experience</option>
                  <option value="comfortable_with_ai_tools">Comfortable with AI coding tools</option>
                </select>
              </Field>

              <Field label="Tech preferences (comma-separated, optional)">
                <input
                  disabled={form.noTechPreference}
                  maxLength={200}
                  value={form.techPreferences}
                  onChange={(e) => setForm({ ...form, techPreferences: e.target.value })}
                  placeholder="e.g. Next.js, Supabase"
                  className="h-11 w-full border border-black px-3 text-sm text-black disabled:opacity-40"
                />
                <label className="mt-2 flex min-h-11 items-center gap-2 text-xs text-black">
                  <input
                    type="checkbox"
                    checked={form.noTechPreference}
                    onChange={(e) => setForm({ ...form, noTechPreference: e.target.checked })}
                  />
                  No preference, let the AI decide
                </label>
              </Field>

              <Field label="Inspiration or reference example (optional)">
                <input
                  maxLength={300}
                  value={form.inspiration}
                  onChange={(e) => setForm({ ...form, inspiration: e.target.value })}
                  placeholder="An existing app/site this should resemble or avoid resembling"
                  className="h-11 w-full border border-black px-3 text-sm text-black"
                />
              </Field>

              <Field label="Hard constraints / things to avoid (optional)">
                <input
                  maxLength={300}
                  value={form.constraints}
                  onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                  placeholder="e.g. Must run on the free tier only"
                  className="h-11 w-full border border-black px-3 text-sm text-black"
                />
              </Field>

              {submitting && <GeneratingStatus />}
              {error && (
                <p role="alert" className="border border-signal p-3 text-sm text-signal">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="h-14 w-full disabled:opacity-50 k-btn k-btn-primary"
              >
                {submitting ? "Generating…" : "Generate My Prompt"}
              </button>
            </form>

            {result && (
              <div ref={resultRef}>
                <BlueprintResult generation={result} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-black k-label">
        {label}
        {required && <span className="text-signal"> *</span>}
      </span>
      {children}
    </label>
  );
}

export default function AssistantPage() {
  return (
    <PremiumGuard accessKey="hasAssistantAccess" feature="assistant">
      <Wizard />
    </PremiumGuard>
  );
}
