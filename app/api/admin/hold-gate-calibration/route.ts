/**
 * GET /api/admin/hold-gate-calibration — everything the admin page needs
 * to render in one call: the latest run, full run history, and every
 * pending suggestion across all runs.
 * Role required: admin only.
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import {
  getLatestCalibrationRun,
  getCalibrationRunHistory,
  getPendingSuggestions,
} from "@/features/hold-gate-calibration/repository";

export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE + 2. AUTHORIZE
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. VALIDATE (no request body)

    // 4. EXECUTE
    const [latestRun, runHistory, pendingSuggestions] = await Promise.all([
      getLatestCalibrationRun(),
      getCalibrationRunHistory(),
      getPendingSuggestions(),
    ]);

    // 5. RETURN
    return NextResponse.json({ latestRun, runHistory, pendingSuggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[HOLD_GATE_CALIBRATION] Failed to fetch admin page data: ${message}`);
    return NextResponse.json({ error: "Failed to fetch calibration data" }, { status: 500 });
  }
}
