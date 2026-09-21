/**
 * GET /api/badges: the badge catalogue with the ones the caller has earned and when (PDL-075). Any signed-in user
 * may read their own badges (the same access as the coin balance). E-6: authenticate, authorize, execute, return.
 */
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { BADGES } from "@/features/badges/domain";
import { getEarnedBadges } from "@/features/badges/repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const earned = new Map((await getEarnedBadges(user.sub)).map((b) => [b.badge_id, b.awarded_at]));
    return NextResponse.json({
      success: true,
      data: {
        badges: BADGES.map((b) => ({ ...b, earned: earned.has(b.id), awardedAt: earned.get(b.id) ?? null })),
        earnedCount: earned.size,
        total: BADGES.length,
      },
    });
  } catch (err) {
    console.error(`[BADGES] Error fetching badges: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}
