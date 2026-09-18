/**
 * GET /api/admin/users/[id] — one user's full detail: profile, feature
 * usage (Assistant generations, lessons completed), and payment history.
 * Role required: admin.
 * specs/admin-console-and-subscription-lifecycle/. E-6 five-step.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { getUserDetail } from "@/features/admin-users/repository";
import { getPaymentEventsForUser } from "@/features/payments/repository";
import { z } from "zod";

const idSchema = z.string().uuid();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const [user, payments] = await Promise.all([
      getUserDetail(parsed.data),
      getPaymentEventsForUser(parsed.data),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...user, payments } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN_USERS] detail failed: ${message}`);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}
