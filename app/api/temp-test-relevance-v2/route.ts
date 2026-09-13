/**
 * TEMP verification route for Phase 2's graded relevance score
 * (2026-09-13). Delete immediately after use.
 */
import { NextRequest, NextResponse } from "next/server";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { assessRelevanceOutputSchema } from "@/lib/validation/schemas";
import { RELEVANCE_THRESHOLD } from "@/features/pipeline/quality-engine";
import { verifyAdminToken } from "@/lib/auth/verify-token";

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token === CRON_SECRET;
}

const TEST_CASES = [
  { label: "off-topic: NTSB aviation", title: "NTSB Issues Investigative Update on B-767 Runway Excursion Accident in Miami", summary: "The National Transportation Safety Board released an update on its investigation into a Boeing 767 runway excursion accident in Miami." },
  { label: "off-topic: Navier-Stokes math", title: "The part of Navier-Stokes no one is talking about", summary: "A deep dive into an overlooked aspect of the Navier-Stokes equations in fluid dynamics." },
  { label: "off-topic: cables essay", title: "Don't let anyone take away your big box of cables", summary: "A personal essay in defense of keeping a large collection of old cables and adapters." },
  { label: "on-topic: MCP", title: "Introducing MCP support for context engineering in AI agents", summary: "A new open standard lets AI coding agents connect to external tools and data sources via the Model Context Protocol." },
  { label: "on-topic: Cursor release", title: "Cursor 2.0 ships a new agent mode with multi-file editing", summary: "Cursor's latest release adds an autonomous agent mode that can plan and edit across multiple files in a codebase, aimed at AI-assisted developers." },
  { label: "borderline: general AI research", title: "New transformer architecture improves reasoning benchmarks", summary: "Researchers propose a new attention mechanism that improves performance on general reasoning tasks, not specific to coding." },
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

  const results = [];
  for (const testCase of TEST_CASES) {
    try {
      const raw = await aiProvider.assessRelevance({ title: testCase.title, summary: testCase.summary });
      const parsed = assessRelevanceOutputSchema.safeParse(raw);
      results.push({
        label: testCase.label,
        parsedOk: parsed.success,
        relevanceScore: parsed.success ? parsed.data.relevanceScore : null,
        wouldExclude: parsed.success ? parsed.data.relevanceScore < RELEVANCE_THRESHOLD : null,
        reasoning: parsed.success ? parsed.data.reasoning : null,
        parseError: parsed.success ? null : parsed.error.message,
      });
    } catch (err) {
      results.push({ label: testCase.label, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ threshold: RELEVANCE_THRESHOLD, results });
}
