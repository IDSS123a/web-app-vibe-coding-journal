import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/payments/paypal-client";

export async function GET() {
  try {
    const result = await createPayPalOrder("basic", "temp-us-account-test");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
