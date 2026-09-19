/**
 * Admin API: PUT /api/admin/reports/[date]/reject
 * Reject a held_for_review report
 * Auth: Admin only
 */

import { isCalendarDate } from "@/lib/validation/dates";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/resend";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import type { DailyReport } from "@/lib/validation/schemas";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  try {
    // E-6 Step 1: Authenticate + E-6 Step 2: Authorize (admin role check)
    const authHeader = request.headers.get("authorization");
    const verified = await verifyAdminToken(authHeader);

    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rejecterEmail = verified.email;

    // E-6 Step 3: Validate date and body
    if (!isCalendarDate(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const rejectedBy = body.rejectedBy || rejecterEmail;
    const reason = body.reason || "No reason provided";

    if (!supabaseAdmin) {
      throw new Error("Admin client not available");
    }

    // E-6 Step 4: Execute
    // Get current report
    const { data: currentReport, error: fetchError } = await supabaseAdmin
      .from("daily_reports")
      .select("*")
      .eq("date", date)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Failed to fetch report: ${fetchError.message}`);
    }

    if (!currentReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report status
    const now = new Date().toISOString();
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from("daily_reports")
      .update({
        review_status: "rejected",
        rejected_by: rejectedBy,
        rejected_at: now,
        updated_at: now,
      })
      .eq("date", date)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    // Send email notification
    await sendAdminNotification({
      subject: `Daily digest for ${date} rejected`,
      html: `<p>Report rejected by ${rejectedBy} at ${now}</p><p>Reason: ${reason}</p><p>Status: rejected</p>`,
    });

    // E-6 Step 5: Return
    console.log(`[ADMIN] Report ${date} rejected by ${rejectedBy}`);
    return NextResponse.json(
      {
        success: true,
        date: date,
        report: updatedReport as DailyReport,
        message: "Report rejected",
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error rejecting report: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
