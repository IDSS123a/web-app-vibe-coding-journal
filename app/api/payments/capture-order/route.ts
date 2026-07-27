/**
 * POST /api/payments/capture-order — finalizes a buyer-approved PayPal
 * order. This does NOT touch subscription_status (per Decision 2, only the
 * verified webhook does that) -- it only tells PayPal to actually capture
 * the funds, which is the prerequisite for PayPal ever emitting the
 * PAYMENT.CAPTURE.COMPLETED event our webhook activates on.
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { capturePayPalOrder } from "@/lib/payments/paypal-client";

const captureOrderSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (any authenticated user may capture an order they approved)

    // 3. VALIDATE
    const body = await request.json().catch(() => null);
    const parsed = captureOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    // 4. EXECUTE
    const result = await capturePayPalOrder(parsed.data.orderId);

    // 5. RETURN
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PAYMENTS] capture-order failed: ${message}`);
    return NextResponse.json({ error: "Failed to capture order" }, { status: 500 });
  }
}
