/**
 * TEMP verification route for the P-0 relevance gate fix (2026-09-11).
 * Exercises the real assessRelevance() -> Gemini -> Zod-validation path
 * against the exact off-topic examples the Director reported, plus a
 * genuine on-topic example, to prove the fix judges correctly before
 * trusting it in the real pipeline. Delete immediately after use.
 */
import { NextRequest, NextResponse } from "next/server";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { assessRelevanceOutputSchema } from "@/lib/validation/schemas";
import { verifyAdminToken } from "@/lib/auth/verify-token";

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token === CRON_SECRET;
}

const TEST_CASES = [
  {
    label: "off-topic: NTSB aviation report",
    title: "NTSB Issues Investigative Update on B-767 Runway Excursion Accident in Miami",
    summary: "The National Transportation Safety Board released an update on its investigation into a Boeing 767 runway excursion accident in Miami.",
  },
  {
    label: "off-topic: Navier-Stokes math",
    title: "The part of Navier-Stokes no one is talking about",
    summary: "A deep dive into an overlooked aspect of the Navier-Stokes equations in fluid dynamics.",
  },
  {
    label: "off-topic: music theory",
    title: "Music Theory for the 21st-Century Classroom",
    summary: "An essay on modernizing how music theory is taught to students today.",
  },
  {
    label: "off-topic: NASA/Mars imaging",
    title: "NASA Color Trick Was Meant for Mars. Now It's Unveiling Rock Art on Earth",
    summary: "A false-color imaging technique developed for Mars rovers is now being used to reveal ancient rock art on Earth.",
  },
  {
    label: "off-topic: cables essay",
    title: "Don't let anyone take away your big box of cables",
    summary: "A personal essay in defense of keeping a large collection of old cables and adapters.",
  },
  {
    label: "on-topic: real vibe-coding tool release",
    title: "Cursor 2.0 ships a new agent mode with multi-file editing",
    summary: "Cursor's latest release adds an autonomous agent mode that can plan and edit across multiple files in a codebase, aimed at AI-assisted developers.",
  },
  {
    label: "on-topic: prompt engineering for coding agents",
    title: "How to write better prompts for Claude Code and Cursor",
    summary: "A practical guide to structuring prompts and context so AI coding agents produce more reliable code changes.",
  },
];

export async function POST(request: NextRequest) {
  const isCronRequest = validateCronAuth(request);
  if (!isCronRequest) {
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  ensureAIProviderInitialized();
  const aiProvider = getAIProvider();

  // Diagnostic: is 404 specific to assessRelevance(), or a pipeline-wide
  // Gemini outage hitting the pre-existing summarize()/classify() too?
  let summarizeProbe: { ok: boolean; error?: string } = { ok: false };
  try {
    await aiProvider.summarize({ text: "Test article for diagnostic probe." });
    summarizeProbe = { ok: true };
  } catch (err) {
    summarizeProbe = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Raw diagnostic, bypassing callGeminiJSON's generic "HTTP 404" message,
  // to see Google's actual error body per key index -- never logs/returns
  // any key value itself, only which numbered slot produced which status.
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const rawDiagnostic: Array<{ keyIndex: number; status?: number; bodyText?: string; error?: string }> = [];
  for (let i = 1; i <= 8; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (!key) continue;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Say hello." }] }] }),
      });
      const bodyText = await resp.text();
      rawDiagnostic.push({ keyIndex: i, status: resp.status, bodyText: bodyText.slice(0, 300) });
    } catch (err) {
      rawDiagnostic.push({ keyIndex: i, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const results = [];
  for (const testCase of TEST_CASES) {
    try {
      const raw = await aiProvider.assessRelevance({
        title: testCase.title,
        summary: testCase.summary,
      });
      const parsed = assessRelevanceOutputSchema.safeParse(raw);
      results.push({
        label: testCase.label,
        title: testCase.title,
        parsedOk: parsed.success,
        isRelevant: parsed.success ? parsed.data.isRelevant : null,
        reasoning: parsed.success ? parsed.data.reasoning : null,
        parseError: parsed.success ? null : parsed.error.message,
      });
    } catch (err) {
      results.push({
        label: testCase.label,
        title: testCase.title,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ summarizeProbe, rawDiagnostic, results });
}
