import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "no admin client" }, { status: 500 });
  }
  const { email } = await request.json();
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
  const target = list.users.find((u) => u.email === email);
  if (!target) {
    return NextResponse.json({
      found: false,
      totalUsers: list.users.length,
      matches: list.users.filter((u) => u.email?.includes("sprint08")).map((u) => u.email),
    });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("delete") === "1") {
    await supabaseAdmin.from("payment_events").delete().eq("user_id", target.id);
    const profileDelete = await supabaseAdmin.from("user_profiles").delete().eq("id", target.id);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(target.id);
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message, profileDeleteError: profileDelete.error?.message ?? null },
        { status: 500 },
      );
    }
    return NextResponse.json({ found: true, deleted: true, id: target.id });
  }

  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({ subscription_status: "expired" })
    .eq("id", target.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ found: true, expired: true, id: target.id });
}
