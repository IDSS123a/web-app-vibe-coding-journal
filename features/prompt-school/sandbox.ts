/**
 * Live sandbox domain logic (PDL-077, specs/prompt-school/). Pure functions only: the limits, the task lookup, how a
 * learner's prompt and the fixed sample input are put together, and the shape of a request. No I/O (see repository.ts).
 *
 * The sandbox runs the learner's OWN prompt on a real model against a FIXED sample input, never free text from the learner,
 * so it cannot be used as a general chatbot. A run is not graded, pays no coins and stores no text: only that it happened.
 */
import { z } from "zod";
import { SANDBOX_TASKS, type SandboxTask } from "./content/sandbox-tasks";
import {
  SANDBOX_DAILY_CAP_PER_USER,
  SANDBOX_DAILY_GLOBAL_CAP,
  SANDBOX_INPUT_MARKER,
  SANDBOX_MAX_PROMPT_CHARS,
  SANDBOX_MAX_REPLY_CHARS,
  SANDBOX_MIN_PROMPT_CHARS,
} from "./sandbox-limits";

export {
  SANDBOX_DAILY_CAP_PER_USER,
  SANDBOX_DAILY_GLOBAL_CAP,
  SANDBOX_INPUT_MARKER,
  SANDBOX_MAX_PROMPT_CHARS,
  SANDBOX_MAX_REPLY_CHARS,
  SANDBOX_MIN_PROMPT_CHARS,
};

export const sandboxRunSchema = z.object({
  prompt: z.string().min(SANDBOX_MIN_PROMPT_CHARS).max(SANDBOX_MAX_PROMPT_CHARS),
});

export function taskIdFor(chapterSlug: string, lessonSlug: string): string {
  return `${chapterSlug}/${lessonSlug}`;
}

export function findSandboxTask(chapterSlug: string, lessonSlug: string): SandboxTask | null {
  return SANDBOX_TASKS.find((t) => t.chapterSlug === chapterSlug && t.lessonSlug === lessonSlug) ?? null;
}

/** What the browser may see before a run: everything except the checklist, which is shown with the result. */
export interface PublicSandboxTask {
  id: string;
  title: string;
  brief: string;
  sampleInput: string;
  starter: string | null;
}

export function toPublicSandboxTask(task: SandboxTask): PublicSandboxTask {
  return {
    id: taskIdFor(task.chapterSlug, task.lessonSlug),
    title: task.title,
    brief: task.brief,
    sampleInput: task.sampleInput,
    starter: task.starter ?? null,
  };
}

export function isUserCapExceeded(runsToday: number): boolean {
  return runsToday >= SANDBOX_DAILY_CAP_PER_USER;
}

export function isGlobalCapExceeded(runsToday: number): boolean {
  return runsToday >= SANDBOX_DAILY_GLOBAL_CAP;
}

export function runsLeft(runsToday: number): number {
  return Math.max(0, SANDBOX_DAILY_CAP_PER_USER - runsToday);
}

/**
 * Puts the learner's prompt and the sample input together exactly as a learner would paste them into a chat: the marker is
 * replaced by the sample, and without a marker the sample follows the prompt. The wrapper's own tag names are removed from
 * the learner's text so it cannot close the block it sits in.
 */
export function assembleSandboxPrompt(prompt: string, sampleInput: string): string {
  const cleaned = prompt.replace(/<\/?\s*(learner_prompt|sandbox_rules)\b[^>]*>/gi, "").trim();
  const hasMarker = /\{\{\s*input\s*\}\}/i.test(cleaned);
  return hasMarker ? cleaned.replace(/\{\{\s*input\s*\}\}/gi, () => sampleInput) : `${cleaned}\n\n${sampleInput}`;
}

/** The reply is shown as plain text, so it is only trimmed and capped. */
export function cleanSandboxReply(reply: string): string {
  const text = reply.trim();
  return text.length > SANDBOX_MAX_REPLY_CHARS ? `${text.slice(0, SANDBOX_MAX_REPLY_CHARS).trimEnd()}…` : text;
}
