/**
 * POST /api/admin/users/[id]/block — blocks a user's access.
 * Role required: admin.
 * Response includes a disclosed limitation (E-4): blocks new sign-ins
 * immediately; a session token already issued can remain valid until
 * its own expiry (typically ~1h) — not solved here, surfaced instead.
 * specs/admin-console-and-subscription-lifecycle/. E-6 five-step.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { setUserBlocked } from "@/features/admin-users/repository";
import { z } from "zod";

const idSchema = z.string().uuid();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdminToken(request.headers.get("authorization"));
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await setUserBlocked(parsed.data, true);

    return NextResponse.json({
      success: true,
      warning:
        "New sign-ins are blocked immediately. A session token this user already has can remain valid until its own natural expiry (typically up to ~1 hour) — this is a known Supabase Auth limitation, not an app bug.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN_USERS] block failed: ${message}`);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}
