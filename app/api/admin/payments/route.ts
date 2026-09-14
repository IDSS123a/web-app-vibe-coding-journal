/**
 * Admin API: GET /api/admin/payments
 * List recent payment events, newest first (Director's 2026-09-14
 * request: admin should see a payment as soon as it happens).
 * Auth: Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { getRecentPaymentEvents } from "@/features/payments/repository";

export async function GET(request: NextRequest) {
  try {
    // E-6 Step 1/2: Authenticate + Authorize (admin role check)
    const verified = await verifyAdminToken(request.headers.get("authorization"));
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // E-6 Step 3: Validate
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

    // E-6 Step 4: Execute
    const events = await getRecentPaymentEvents(limit);

    // E-6 Step 5: Return
    return NextResponse.json({ success: true, events });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error fetching payment events: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
