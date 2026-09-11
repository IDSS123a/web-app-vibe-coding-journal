/**
 * PATCH /api/admin/hold-gate-calibration/suggestions/[id]
 * Role required: admin only -- no CRON_SECRET path, applying/dismissing
 * a suggestion is always an explicit Director action (SPEC.md), never
 * something a scheduled job does on its own.
 * Body: { status: "applied" | "dismissed" }
 * Response: { success: true }
 * Errors: 401 (unauthenticated/not admin), 400 (invalid status),
 *         404 (no suggestion with this id -- fixed 2026-09-11, see
 *         SuggestionNotFoundError), 500
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import {
  updateSuggestionStatus,
  SuggestionNotFoundError,
} from "@/features/hold-gate-calibration/repository";

const updateStatusSchema = z.object({
  status: z.enum(["applied", "dismissed"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // 1. AUTHENTICATE + 2. AUTHORIZE
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. VALIDATE
    const body = await request.json().catch(() => null);
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 4. EXECUTE
    await updateSuggestionStatus(id, parsed.data.status, verified.sub);

    // 5. RETURN
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof SuggestionNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[HOLD_GATE_CALIBRATION] Failed to update suggestion ${id}: ${message}`);
    return NextResponse.json({ error: "Failed to update suggestion" }, { status: 500 });
  }
}
