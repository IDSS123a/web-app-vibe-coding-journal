/**
 * PATCH /api/admin/users/[id]/plan: the admin ends a paid plan or sets the day it ends (PDL-079). Needed after a refund
 * (the Refund Policy says the paid access ends, or an upgrade returns the account to Basic for the rest of the original year)
 * and to correct a mistake. It changes only the status and the end date, never a payment record.
 * Role required: admin.
 * Body: { action: "end_now" } or { action: "set_end_date", date: "YYYY-MM-DD" } (adminSetPlanSchema)
 * Response: { success: true, status, expiresAt }
 * Errors: 401, 404, 422, 500. E-6 five-step.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { adminSetPlanSchema } from "@/lib/validation/schemas";
import { setUserPlanEnd } from "@/features/admin-users/repository";

const idSchema = z.string().uuid();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1+2. AUTHENTICATE + AUTHORIZE
    const admin = await verifyAdminToken(request.headers.get("authorization"));
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. VALIDATE
    const { id } = await params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json().catch(() => null);
    const parsed = adminSetPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
    }

    // 4. EXECUTE
    const endAt = parsed.data.action === "end_now" ? new Date() : new Date(`${parsed.data.date}T23:59:59.000Z`);
    const result = await setUserPlanEnd(parsedId.data, endAt);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.log(`[ADMIN_USERS] ${admin.email} set the plan of ${parsedId.data} to ${result.status}, ends ${result.expiresAt}`);

    // 5. RETURN
    return NextResponse.json({ success: true, status: result.status, expiresAt: result.expiresAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN_USERS] set plan failed: ${message}`);
    return NextResponse.json({ error: "Failed to change the plan" }, { status: 500 });
  }
}
