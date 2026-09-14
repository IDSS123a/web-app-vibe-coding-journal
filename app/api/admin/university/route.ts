/**
 * Admin API: GET /api/admin/university
 * List lessons pending review (AI-generated, not yet published or
 * rejected) — specs/vibe-coding-university/PLAN.md's review-queue
 * pattern, mirroring /api/admin/reports for the Daily Report.
 * Auth: Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { getPendingReviewLessons } from "@/features/university/repository";

export async function GET(request: NextRequest) {
  try {
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessons = await getPendingReviewLessons();

    return NextResponse.json({ success: true, lessons });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error fetching pending-review lessons: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
