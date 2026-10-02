import { supabaseAdmin } from "@/lib/db/client";
import type { PublicTool } from "./domain";

const PUBLIC_COLUMNS = "id, name, slug, description, url, pricing, mention_count, last_seen_at, first_seen_at";

// The list changes only when the hourly backlog cycle promotes a new tool, so a warm
// server instance keeps it for a few minutes instead of re-querying on every request
// (same convention as features/dictionary/repository.ts's getAllTerms).
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; tools: PublicTool[] } | null = null;

// No paging (unlike Dictionary's ~2,600 rows): promotion requires 3+ independently-
// sourced mentions within 14 days (features/tools/discovery.ts), so this list grows
// slowly by nature. 1000 is PostgREST's own per-request cap and is not expected to be
// reached for a long time; revisit with Dictionary's parallel-paging pattern
// (features/dictionary/repository.ts, PDL-091) if it ever does.
const ROW_CAP = 1000;

function toPublicTool(row: Record<string, unknown>): PublicTool {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    url: (row.url as string | null) ?? null,
    pricing: row.pricing as PublicTool["pricing"],
    mentionCount: (row.mention_count as number) ?? 0,
    lastSeenAt: (row.last_seen_at as string | null) ?? null,
    firstSeenAt: row.first_seen_at as string,
  };
}

export async function getAllTools(): Promise<PublicTool[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.tools;

  const { data, error } = await supabaseAdmin
    .from("tools")
    .select(PUBLIC_COLUMNS)
    .eq("status", "published")
    .order("name", { ascending: true })
    .limit(ROW_CAP);
  if (error) throw new Error(`Failed to fetch tools: ${error.message}`);

  const tools = (data ?? []).map(toPublicTool);
  cached = { at: Date.now(), tools };
  return tools;
}
