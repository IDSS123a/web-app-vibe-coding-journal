/**
 * GET /api/admin/users — list every account (email, role, tier, status,
 * blocked, expiry).
 * POST /api/admin/users — create a brand-new account (invite by email,
 * no admin-set password — E-4), directly assigned to the $10 or $50 tier.
 * Role required: admin.
 * specs/admin-console-and-subscription-lifecycle/. E-6 five-step:
 * authenticate+authorize (verifyAdminToken) → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { adminCreateUserSchema } from "@/lib/validation/schemas";
import { listUsers, userExistsByEmail, createAdminInvitedUser } from "@/features/admin-users/repository";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminToken(request.headers.get("authorization"));
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await listUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN_USERS] list failed: ${message}`);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminToken(request.headers.get("authorization"));
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = adminCreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 422 });
    }

    const exists = await userExistsByEmail(parsed.data.email);
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // The invite link must land on the set-password page of THIS site
    // (derived from the request, not a hardcoded host, so it stays right
    // across production/preview domains).
    const redirectTo = `${new URL(request.url).origin}/set-password`;
    const { userId } = await createAdminInvitedUser(parsed.data.email, parsed.data.tier, admin.sub, redirectTo);

    return NextResponse.json({ success: true, data: { userId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN_USERS] create failed: ${message}`);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
