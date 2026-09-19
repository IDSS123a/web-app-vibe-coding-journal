/**
 * Trailing-24-hour accounting of AI requests by purpose (migration 026). Used to hold
 * background work to a budget on the free Gemini tier. Best effort: a failed write or read
 * must never break the pipeline, so both functions degrade instead of throwing.
 */
import { supabaseAdmin } from "@/lib/db/client";

export async function recordAiCalls(purpose: string, calls: number): Promise<void> {
  if (!supabaseAdmin || calls <= 0) return;
  const { error } = await supabaseAdmin.from("ai_call_log").insert({ purpose, calls });
  if (error) console.error(`[AI_USAGE] Could not record ${calls} call(s) for "${purpose}": ${error.message}`);
}

export async function aiCallsInLast24h(purpose: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin.from("ai_call_log").select("calls").eq("purpose", purpose).gte("created_at", since);
  if (error) {
    console.error(`[AI_USAGE] Could not read usage for "${purpose}": ${error.message}`);
    return 0;
  }
  return (data ?? []).reduce((sum, row) => sum + (row.calls as number), 0);
}
