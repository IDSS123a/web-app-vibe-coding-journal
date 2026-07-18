/**
 * Admin API: GET /api/admin/reports
 * List all held_for_review reports (paginated)
 * Auth: Admin only
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import type { DailyReport } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    // E-6 Step 1: Authenticate + E-6 Step 2: Authorize (admin role check)
    const authHeader = request.headers.get("authorization");
    const verified = await verifyAdminToken(authHeader);

    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // E-6 Step 3: Validate query params
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "held_for_review";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!supabaseAdmin) {
      throw new Error("Admin client not available");
    }

    // E-6 Step 4: Execute
    const { data, error, count } = await supabaseAdmin
      .from("daily_reports")
      .select("*", { count: "exact" })
      .eq("review_status", status)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    // E-6 Step 5: Return
    return NextResponse.json(
      {
        success: true,
        reports: data as DailyReport[],
        total: count || 0,
        page: Math.floor(offset / limit),
        pageSize: limit,
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error fetching reports: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
