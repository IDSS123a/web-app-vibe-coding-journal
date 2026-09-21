/**
 * POST /api/payments/create-order — creates a PayPal order (sandbox or live, see lib/payments/paypal-mode.ts) for
 * the requesting user's chosen tier. The client uses the returned order
 * ID with PayPal's JS SDK to render the approval flow. This route does
 * NOT activate any subscription — per Decision 2, only a verified
 * webhook capture event does that.
 * 409 when the user already has an active plan they cannot buy again (PDL-079).
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { createPayPalOrder } from "@/lib/payments/paypal-client";
import { supabaseAdmin } from "@/lib/db/client";
import { checkFreshOrderEligibility } from "@/features/payments/domain";

const createOrderSchema = z.object({
  tier: z.enum(["basic", "premium"]),
});

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (any authenticated user may start a checkout)

    // 3. VALIDATE
    const body = await request.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // 4. EXECUTE
    // Real money (PDL-079): never let someone pay for a plan they already have.
    if (supabaseAdmin) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("subscription_status, subscription_tier, subscription_expires_at")
        .eq("id", user.sub)
        .maybeSingle();
      if (profile) {
        const eligibility = checkFreshOrderEligibility(parsed.data.tier, {
          status: profile.subscription_status as "trial" | "active" | "expired",
          tier: profile.subscription_tier as "basic" | "premium",
          expiresAt: profile.subscription_expires_at ? new Date(profile.subscription_expires_at as string) : null,
          now: new Date(),
        });
        if (!eligibility.ok) return NextResponse.json({ error: eligibility.reason }, { status: 409 });
      }
    }
    const { orderId, approveUrl } = await createPayPalOrder(parsed.data.tier, user.sub);

    // 5. RETURN
    return NextResponse.json({ orderId, approveUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PAYMENTS] create-order failed: ${message}`);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
