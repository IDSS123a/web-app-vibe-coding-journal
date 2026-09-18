/**
 * POST /api/admin/users/[id]/unblock — restores a previously blocked
 * user's normal access immediately.
 * Role required: admin.
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

    await setUserBlocked(parsed.data, false);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN_USERS] unblock failed: ${message}`);
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
  }
}
