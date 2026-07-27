import { NextResponse } from "next/server";
import { getPaymentEventByPaypalId } from "@/features/payments/repository";
import { supabaseAdmin } from "@/lib/db/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const latest = searchParams.get("latest");
  const email = searchParams.get("email");

  if (latest) {
    if (!supabaseAdmin) return NextResponse.json({ error: "no admin client" }, { status: 500 });
    const { data, error } = await supabaseAdmin
      .from("payment_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events: data });
  }

  if (email) {
    if (!supabaseAdmin) return NextResponse.json({ error: "no admin client" }, { status: 500 });
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
    const target = list.users.find((u) => u.email === email);
    if (!target) return NextResponse.json({ found: false });
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("subscription_status, subscription_tier, subscription_expires_at")
      .eq("id", target.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ found: true, profile: data });
  }

  if (!id) return NextResponse.json({ error: "pass ?id= or ?latest=1 or ?email=" }, { status: 400 });
  const event = await getPaymentEventByPaypalId(id);
  return NextResponse.json({ found: !!event, event });
}
