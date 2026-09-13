/**
 * TEMP diagnostic (2026-09-13): minimal, fast re-check of
 * collectArticlesFromAllSources() after the reliability fixes, with
 * per-source progress logging so a hang (if any remains) is
 * immediately visible in Vercel's real-time logs instead of a silent
 * client-side timeout. Delete immediately after use.
 */
import { NextRequest, NextResponse } from "next/server";
import { collectArticlesFromAllSources } from "@/features/sources/actions";
import { verifyAdminToken } from "@/lib/auth/verify-token";

export async function POST(request: NextRequest) {
  const verified = await verifyAdminToken(request.headers.get("authorization"));
  if (!verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[TEMP-CHECK] Starting collectArticlesFromAllSources()");
  const start = Date.now();
  const result = await collectArticlesFromAllSources();
  const durationMs = Date.now() - start;
  console.log(`[TEMP-CHECK] Completed in ${durationMs}ms: ${JSON.stringify(result)}`);

  return NextResponse.json({ durationMs, result });
}
