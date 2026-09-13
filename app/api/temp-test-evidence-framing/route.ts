/**
 * TEMP verification route for Phase 3's evidence-framing rule
 * (2026-09-13). Delete immediately after use.
 */
import { NextRequest, NextResponse } from "next/server";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
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
    label: "vendor productivity claim",
    text: "Acme AI today announced Acme Coder 3.0. The company says the new release makes developers 5x faster at shipping production code, citing an internal study of 200 engineers. Acme Coder 3.0 is available now for existing customers.",
  },
  {
    label: "plain factual release, no unverified claim",
    text: "GitHub announced that Copilot now supports a new agent mode in VS Code, allowing it to make multi-file edits and run terminal commands with user approval. The feature is rolling out to all Copilot subscribers this week.",
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

  const results = [];
  for (const testCase of TEST_CASES) {
    try {
      const summary = await aiProvider.summarize({ text: testCase.text });
      results.push({ label: testCase.label, summary });
    } catch (err) {
      results.push({ label: testCase.label, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ results });
}
