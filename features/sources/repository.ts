import { supabase, supabaseAdmin } from "@/lib/db/client";
import type { Source } from "./domain";
import { createSourceSchema, type CreateSourceInput } from "./domain";

/**
 * Get all enabled sources for polling
 * Used by Source Collector during cron job.
 * Uses the admin (service-role) client because the sources table has RLS
 * that blocks anon reads; the cron runs server-side with no user session,
 * so it must bypass RLS to see the source list.
 */
export async function getEnabledSources(): Promise<Source[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  // Enabled sources, PLUS disabled ones whose cool-down has elapsed (see
  // computeSourceFailure in domain.ts): a failing source is retried later
  // instead of staying dark forever.
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("sources")
    .select("*")
    .or(`enabled.eq.true,retry_after.lte.${nowIso}`)
    .order("last_polled", { ascending: true, nullsFirst: true });

  if (error) {
    throw new Error(`Failed to fetch enabled sources: ${error.message}`);
  }

  return data as Source[];
}

/**
 * Get all sources (admin view)
 */
export async function getAllSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch sources: ${error.message}`);
  }

  return data as Source[];
}

/**
 * Get source by ID
 */
export async function getSourceById(id: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = "not found"
    throw new Error(`Failed to fetch source: ${error.message}`);
  }

  return (data as Source) || null;
}

/**
 * Create a new source (admin/system only)
 * Requires service_role key
 */
export async function createSource(input: CreateSourceInput): Promise<Source> {
  const parsed = createSourceSchema.parse(input);

  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("sources")
    .insert(parsed)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create source: ${error.message}`);
  }

  return data as Source;
}

/**
 * Update source (track polling and failure count)
 * Used by Source Collector pipeline
 */
export async function updateSource(
  id: string,
  updates: Partial<{
    last_polled: string;
    last_success: string;
    failure_count: number;
    enabled: boolean;
    retry_after: string | null;
    disabled_at: string | null;
    source_class: Source["source_class"];
    trust_score: Source["trust_score"];
    topics: string[];
  }>,
): Promise<Source> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("sources")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update source: ${error.message}`);
  }

  return data as Source;
}

/**
 * Delete source (admin only)
 */
export async function deleteSource(id: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("sources")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete source: ${error.message}`);
  }
}
