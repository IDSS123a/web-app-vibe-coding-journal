/**
 * POST /api/prompt-school/sandbox/[chapterSlug]/[lessonSlug]: runs the learner's own prompt on a real model against the fixed
 * sample input of that lesson's sandbox task (PDL-077). Premium-only, chapter must be open.
 * Body: { prompt }
 * Response: { reply, runsLeft, checklist }
 * Errors: 401, 403 (not premium, chapter locked), 404 (no sandbox task here), 422 (bad prompt), 429 (the learner's 3 runs a
 *         day are used), 503 (the shared free AI pool is at its daily share or busy), 500.
 * A run is never graded, pays no coins and stores no text. A run that fails is given back and does not count.
 * E-6: authenticate, authorize, validate, execute, return.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { getChapterState } from "@/features/prompt-school/progress";
import {
  countSandboxRunsToday,
  countUserSandboxRunsToday,
  releaseSandboxRun,
  reserveSandboxRun,
} from "@/features/prompt-school/repository";
import {
  SANDBOX_DAILY_CAP_PER_USER,
  assembleSandboxPrompt,
  cleanSandboxReply,
  findSandboxTask,
  isGlobalCapExceeded,
  isUserCapExceeded,
  runsLeft,
  sandboxRunSchema,
  taskIdFor,
} from "@/features/prompt-school/sandbox";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { recordAiCalls } from "@/lib/ai/usage";
import { GeminiKeysExhaustedError, GeminiUnavailableError } from "@/lib/ai/gemini-provider";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export async function POST(request: NextRequest, { params }: { params: Promise<{ chapterSlug: string; lessonSlug: string }> }) {
  let reservation: string | null = null;
  try {
    // 1. AUTHENTICATE + 2. AUTHORIZE
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const raw = await params;
    const chapterSlug = slugSchema.safeParse(raw.chapterSlug);
    const lessonSlug = slugSchema.safeParse(raw.lessonSlug);
    if (!chapterSlug.success || !lessonSlug.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const task = findSandboxTask(chapterSlug.data, lessonSlug.data);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const state = await getChapterState(auth.user.sub, chapterSlug.data);
    if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!state.unlocked) return NextResponse.json({ error: "Chapter locked", waitingFor: state.waitingFor }, { status: 403 });

    // 3. VALIDATE
    const body = await request.json().catch(() => null);
    const parsed = sandboxRunSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });

    // 4. EXECUTE
    const limitReached = { error: `You have used your ${SANDBOX_DAILY_CAP_PER_USER} sandbox runs for today. They come back tomorrow.`, runsLeft: 0 };
    if (isUserCapExceeded(await countUserSandboxRunsToday(auth.user.sub))) return NextResponse.json(limitReached, { status: 429 });
    if (isGlobalCapExceeded(await countSandboxRunsToday())) {
      // Not the learner's fault (shared free-tier quota protection, PDL-058), so 503 and not 429.
      return NextResponse.json({ error: "The sandbox is at capacity for today. Please try again tomorrow." }, { status: 503 });
    }

    // Reserve first, then re-count, so two runs sent at the same moment cannot both slip under the limit.
    reservation = await reserveSandboxRun(auth.user.sub, taskIdFor(task.chapterSlug, task.lessonSlug), parsed.data.prompt.length);
    const usedNow = await countUserSandboxRunsToday(auth.user.sub);
    if (usedNow > SANDBOX_DAILY_CAP_PER_USER) {
      await releaseSandboxRun(reservation);
      reservation = null;
      return NextResponse.json(limitReached, { status: 429 });
    }

    ensureAIProviderInitialized();
    const output = await getAIProvider().runSandboxPrompt({ assembledPrompt: assembleSandboxPrompt(parsed.data.prompt, task.sampleInput) });
    const reply = cleanSandboxReply(output.reply);
    if (!reply) {
      console.error(`[PROMPT-SCHOOL] Empty sandbox reply for user ${auth.user.sub}`);
      await releaseSandboxRun(reservation);
      reservation = null;
      return NextResponse.json({ error: "The run failed. Nothing was counted against your daily runs, please try again." }, { status: 500 });
    }

    await recordAiCalls("ps_sandbox", 1);

    // 5. RETURN
    return NextResponse.json({ reply, runsLeft: runsLeft(usedNow), checklist: task.checklist });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PROMPT-SCHOOL] sandbox run failed: ${message}`);
    if (reservation) await releaseSandboxRun(reservation);
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: "The AI service is busy right now. Nothing was counted against your daily runs, please try again in a minute." }, { status: 503 });
    }
    if (error instanceof GeminiKeysExhaustedError) {
      return NextResponse.json({ error: "The AI service has reached its capacity for now. Nothing was counted against your daily runs, please try again later today." }, { status: 503 });
    }
    return NextResponse.json({ error: "The run failed. Nothing was counted against your daily runs, please try again." }, { status: 500 });
  }
}
