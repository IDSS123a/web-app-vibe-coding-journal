/**
 * POST /api/payments/create-upgrade-order — creates a PayPal sandbox
 * order for the flat $40 Basic→Premium upgrade difference. Parallel to
 * /api/payments/create-order (fresh tier purchase), not a modification
 * of it. This route does NOT activate anything itself — only a verified
 * webhook capture event does (same Decision 2 discipline as the
 * existing tier-purchase flow).
 * Role required: authenticated, currently subscription_tier='basic' AND
 * subscription_status='active' — a real paying Basic subscriber, not a
 * trial or already-expired one.
 * specs/admin-console-and-subscription-lifecycle/. E-6 five-step.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { createPayPalUpgradeOrder } from "@/lib/payments/paypal-client";

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE
    if (user.subscriptionTier !== "basic" || user.subscriptionStatus !== "active") {
      return NextResponse.json(
        { error: "Only an active Basic subscriber can upgrade to Premium" },
        { status: 403 },
      );
    }

    // 3. VALIDATE (no request body)

    // 4. EXECUTE
    const { orderId, approveUrl } = await createPayPalUpgradeOrder(user.sub);

    // 5. RETURN
    return NextResponse.json({ orderId, approveUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PAYMENTS] create-upgrade-order failed: ${message}`);
    return NextResponse.json({ error: "Failed to create upgrade order" }, { status: 500 });
  }
}
