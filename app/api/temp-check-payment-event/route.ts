import { NextResponse } from "next/server";
import { getPaymentEventByPaypalId } from "@/features/payments/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "pass ?id=" }, { status: 400 });
  const event = await getPaymentEventByPaypalId(id);
  return NextResponse.json({ found: !!event, event });
}
