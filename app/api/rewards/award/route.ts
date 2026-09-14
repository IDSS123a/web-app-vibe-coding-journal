/**
 * POST /api/rewards/award — award gamification coins for a user action.
 * Body: { eventType: RewardEventType, dedupeKey?: string | null }
 * Role required: any authenticated user (rewards are per-user, same
 * access level as /api/bookmarks).
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 *
 * Gamification layer (DECISION_LOG.md PDL-030, CONSTITUTION.md P-20).
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { awardCoinsInputSchema } from "@/lib/validation/schemas";
import { awardCoins } from "@/features/rewards/repository";

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (any authenticated user may earn rewards for their own actions)

    // 3. VALIDATE
    const body = await request.json().catch(() => null);
    const parsed = awardCoinsInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reward request" }, { status: 400 });
    }

    // 4. EXECUTE
    const result = await awardCoins(user.sub, parsed.data.eventType, parsed.data.dedupeKey ?? null);

    // 5. RETURN
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[REWARDS] award failed: ${message}`);
    return NextResponse.json({ error: "Failed to award reward" }, { status: 500 });
  }
}
