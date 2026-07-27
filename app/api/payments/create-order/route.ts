/**
 * POST /api/payments/create-order — creates a PayPal sandbox order for
 * the requesting user's chosen tier. The client uses the returned order
 * ID with PayPal's JS SDK to render the approval flow. This route does
 * NOT activate any subscription — per Decision 2, only a verified
 * webhook capture event does that.
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { createPayPalOrder } from "@/lib/payments/paypal-client";

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
    const { orderId, approveUrl } = await createPayPalOrder(parsed.data.tier, user.sub);

    // 5. RETURN
    return NextResponse.json({ orderId, approveUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PAYMENTS] create-order failed: ${message}`);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
