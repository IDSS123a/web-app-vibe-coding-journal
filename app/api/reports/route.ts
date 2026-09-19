/**
 * GET /api/reports?page=N — paginated archive list of published Daily Reports
 * (metadata only, newest first; P-6: never held/rejected).
 * Role required: authenticated with currently-active paid access (Basic or
 * Premium, or trial) — admin exempt.
 * Response: { success: true, data: { reports, hasMore } }
 * Errors: 401, 403 (no active subscription), 422 (bad page), 500
 * Server-side paywall: see features/daily-report/access.ts.
 * E-6 five-step: authenticate → authorise → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePaidContentAccess } from "@/features/daily-report/access";
import { getPublishedReportsPage } from "@/features/archive/repository";

const pageSchema = z.coerce.number().int().min(0).max(1000).default(0);

export async function GET(request: NextRequest) {
  try {
    const access = await requirePaidContentAccess(request);
    if (!access.ok) return access.response;

    const parsed = pageSchema.safeParse(new URL(request.url).searchParams.get("page") ?? undefined);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid page" }, { status: 422 });
    }

    const { reports, hasMore } = await getPublishedReportsPage(parsed.data);
    return NextResponse.json({ success: true, data: { reports, hasMore } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[REPORTS] list failed: ${message}`);
    return NextResponse.json({ error: "Failed to load the archive" }, { status: 500 });
  }
}
