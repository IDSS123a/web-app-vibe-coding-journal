/**
 * Admin API: GET /api/admin/ideas
 * List ideas pending review (AI-generated, not yet published or rejected) --
 * mirrors /api/admin/university's review-queue pattern.
 * Auth: Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { getPendingReviewIdeas } from "@/features/ideas/repository";

export async function GET(request: NextRequest) {
  try {
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ideas = await getPendingReviewIdeas();

    return NextResponse.json({ success: true, ideas });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error fetching pending-review ideas: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
