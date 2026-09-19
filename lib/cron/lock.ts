/**
 * Lease lock for cron routes (migration 024). acquire takes the lease with a single
 * conditional UPDATE, which the database applies atomically: of two simultaneous
 * callers exactly one gets a row back. The lease expires by itself after ttlMs, so a
 * run that is killed by the platform can never leave the lock stuck.
 */
import { supabaseAdmin } from "@/lib/db/client";

export async function acquireCronLock(name: string, ttlMs: number): Promise<boolean> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const now = new Date();
  const { data, error } = await supabaseAdmin
    .from("cron_locks")
    .update({ locked_until: new Date(now.getTime() + ttlMs).toISOString() })
    .eq("name", name)
    .lt("locked_until", now.toISOString())
    .select("name");
  if (error) throw new Error(`Failed to acquire cron lock "${name}": ${error.message}`);
  return (data?.length ?? 0) === 1;
}

export async function releaseCronLock(name: string): Promise<void> {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.from("cron_locks").update({ locked_until: new Date(0).toISOString() }).eq("name", name);
  if (error) console.error(`[CRON] Failed to release lock "${name}": ${error.message}`);
}
