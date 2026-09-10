import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

export async function POST() {
  if (!supabaseAdmin) return NextResponse.json({ error: "no admin client" }, { status: 500 });
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
  const target = list.users.find((u) => u.email === "content-verify-test@example.com");
  if (!target) return NextResponse.json({ found: false });
  await supabaseAdmin.from("user_profiles").delete().eq("id", target.id);
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(target.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ found: true, deleted: true });
}
