import { supabaseAdmin } from "@/lib/db/client";
import type { PublicIdea } from "./domain";

export interface IdeaRow {
  id: string;
  title: string;
  pitch: string;
  body: string | null;
  status: "pending_review" | "published" | "rejected";
  source_article_ids: string[];
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function toPublicIdea(row: IdeaRow): PublicIdea {
  return {
    id: row.id,
    title: row.title,
    pitch: row.pitch,
    body: row.body ?? "",
    createdAt: row.created_at,
  };
}

export async function getPublishedIdeas(): Promise<PublicIdea[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch ideas: ${error.message}`);
  return (data as IdeaRow[]).map(toPublicIdea);
}

export async function getPendingReviewIdeas(): Promise<IdeaRow[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch pending-review ideas: ${error.message}`);
  return data as IdeaRow[];
}

export async function countPendingReviewIdeas(): Promise<number> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { count, error } = await supabaseAdmin.from("ideas").select("*", { count: "exact", head: true }).eq("status", "pending_review");
  if (error) throw new Error(`Failed to count pending ideas: ${error.message}`);
  return count ?? 0;
}

export async function reviewIdea(ideaId: string, decision: "published" | "rejected", reviewerId: string): Promise<void> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { error } = await supabaseAdmin
    .from("ideas")
    .update({ status: decision, reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", ideaId);
  if (error) throw new Error(`Failed to review idea: ${error.message}`);
}

/**
 * Dedup context for the generation prompt: every idea title proposed so far (any status),
 * so the AI never re-pitches a profitable idea that is already published, already
 * rejected, or already sitting in the review queue.
 */
export async function getAllIdeaTitles(): Promise<string[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin.from("ideas").select("title");
  if (error) throw new Error(`Failed to fetch idea titles: ${error.message}`);
  return (data ?? []).map((r) => r.title as string).filter((t) => t.length > 0);
}

/**
 * Source material for the weekly generation job: recent, high-relevance articles --
 * trends, not a single story -- the same relevance bar and lookback window already
 * proven by features/university/repository.ts's getUnusedHighRelevanceArticles, minus
 * the "unused" exclusion: an idea is a synthesis ACROSS several articles, not written
 * from one, so the same recent article legitimately feeding this week's idea is not a
 * problem the way it would be for a single-topic lesson.
 */
export async function getRecentHighRelevanceArticles(limit = 8): Promise<Array<{ id: string; title: string; summary: string | null; raw_summary: string | null }>> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const sinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id, title, summary, raw_summary")
    .is("duplicate_of", null)
    .gte("published_at", sinceIso)
    .gte("relevance_score", 70)
    .order("relevance_score", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to fetch source articles: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    summary: a.summary as string | null,
    raw_summary: a.raw_summary as string | null,
  }));
}

export async function insertIdea(input: {
  title: string;
  pitch: string;
  body: string;
  source_article_ids: string[];
}): Promise<{ id: string }> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .insert({
      title: input.title,
      pitch: input.pitch,
      body: input.body,
      status: "pending_review",
      source_article_ids: input.source_article_ids,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to insert idea: ${error.message}`);
  return { id: data.id as string };
}

export async function hasGenerationRunThisWeek(isoWeek: string): Promise<boolean> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("idea_generation_runs")
    .select("id")
    .eq("iso_week", isoWeek)
    .eq("status", "completed")
    .maybeSingle();
  if (error) throw new Error(`Failed to check generation run: ${error.message}`);
  return !!data;
}

export async function recordGenerationRun(payload: {
  iso_week: string;
  status: "completed" | "failed" | "no_articles_available";
  idea_id: string | null;
  detail: string | null;
}): Promise<void> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { error } = await supabaseAdmin.from("idea_generation_runs").insert(payload);
  if (error) throw new Error(`Failed to record generation run: ${error.message}`);
}
