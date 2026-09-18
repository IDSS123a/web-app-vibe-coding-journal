/**
 * PATCH /api/admin/users/[id]/tier — admin changes an existing user's tier.
 * Role required: admin.
 * Body: { tier: "basic" | "premium" } (adminSetTierSchema)
 * Response: { success: true }
 * Errors: 401, 404 (unknown id / user), 422 (validation), 500
 * Changes ONLY the tier -- status and expiry are untouched (see
 * features/admin-users/repository.ts setUserTier).
 * specs/admin-console-and-subscription-lifecycle/. E-6 five-step.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { adminSetTierSchema } from "@/lib/validation/schemas";
import { setUserTier } from "@/features/admin-users/repository";
import { z } from "zod";

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
    const parsed = adminSetTierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
    }

    // 4. EXECUTE
    const found = await setUserTier(parsedId.data, parsed.data.tier);
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.log(`[ADMIN_USERS] ${admin.email} set tier of ${parsedId.data} to ${parsed.data.tier}`);

    // 5. RETURN
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN_USERS] set tier failed: ${message}`);
    return NextResponse.json({ error: "Failed to change tier" }, { status: 500 });
  }
}
