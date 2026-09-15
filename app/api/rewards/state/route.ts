/**
 * GET /api/rewards/state — the caller's current gamification state
 * (coin balance, level, streak). Gamification Wave 2: added so
 * CoinBalance (rendered globally via RewardsProvider) has something to
 * show on load, not just after an award happens in the same session.
 * Same E-6 shape as /api/rewards/award, minus the VALIDATE step (no
 * request body).
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { getRewardState } from "@/features/rewards/repository";

export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (any authenticated user may read their own reward state)

    // 3. VALIDATE (nothing to validate — no request body)

    // 4. EXECUTE
    const state = await getRewardState(user.sub);

    // 5. RETURN
    return NextResponse.json({ state });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[REWARDS] state fetch failed: ${message}`);
    return NextResponse.json({ error: "Failed to load reward state" }, { status: 500 });
  }
}
