/**
 * GET /api/admin/assistant-usage — today's Vibe-Coding Assistant
 * generation volume vs. the daily caps (P-19's mandatory admin
 * usage/quota visibility requirement, specs/prompt-blueprint-builder/).
 * Auth: Admin only.
 * Response: { success: true, data: { today: { total, capGlobal, perUser: { userId, count }[], sandbox: { total, cap } } } }
 * Errors: 401, 500
 *
 * Deliberately minimal -- a count query, not a dashboard -- matching
 * this project's P-1 (Almost-Zero-Maintenance) philosophy.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { countGenerationsToday, countGenerationsTodayByUser } from "@/features/prompt-assistant/repository";
import { ASSISTANT_DAILY_GLOBAL_CAP } from "@/features/prompt-assistant/domain";
import { countSandboxRunsToday } from "@/features/prompt-school/repository";
import { SANDBOX_DAILY_GLOBAL_CAP } from "@/features/prompt-school/sandbox-limits";

export async function GET(request: NextRequest) {
  try {
    // E-6 Step 1+2: Authenticate + Authorize (admin role check)
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // E-6 Step 3: Execute (no request body for a GET)
    const [total, perUser, sandboxTotal] = await Promise.all([countGenerationsToday(), countGenerationsTodayByUser(), countSandboxRunsToday()]);

    // E-6 Step 4: Return
    return NextResponse.json({
      success: true,
      // The Prompt School sandbox draws on the same free AI pool, so its share is shown next to the Assistant's (PDL-077).
      data: { today: { total, capGlobal: ASSISTANT_DAILY_GLOBAL_CAP, perUser, sandbox: { total: sandboxTotal, cap: SANDBOX_DAILY_GLOBAL_CAP } } },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN] assistant-usage failed: ${message}`);
    return NextResponse.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
