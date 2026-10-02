/**
 * Cron endpoint: /api/cron/ideas-generate
 * Weekly Top Profitable Ideas generation (Director-approved, 2026-10-02 six-step
 * feasibility study, step 5: "ista arhitektura -- zaseban cron, generise npr. 1 ideju
 * sedmicno iz trendova u clancima zadnjih dana, ide u red za tvoje odobrenje prije
 * objave"). Security: requires CRON_SECRET header, same pattern as
 * app/api/cron/daily-digest/route.ts and app/api/cron/university-generate/route.ts.
 *
 * Deliberately its OWN cron, own trigger, own budget -- same reasoning as University's
 * generation cron: a separate low-frequency job can't threaten the daily digest
 * pipeline's own Gemini key budget. Idempotent per ISO week (idea_generation_runs.iso_week,
 * migration 039) -- at most one idea generated per week, regardless of how many times
 * this endpoint is triggered. Unlike University, there is no pre-seeded "stub" to retry:
 * every run proposes a brand-new idea from recent article trends. Nothing here publishes
 * unreviewed -- every generated idea lands in pending_review for the admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError } from "@/lib/ai/gemini-provider";
import { getIsoWeekString, MAX_PENDING_REVIEW_IDEAS } from "@/features/ideas/domain";
import { isValidCronSecret } from "@/lib/cron/auth";
import {
  hasGenerationRunThisWeek,
  countPendingReviewIdeas,
  getRecentHighRelevanceArticles,
  getAllIdeaTitles,
  insertIdea,
  recordGenerationRun,
} from "@/features/ideas/repository";

function validateCronAuth(request: NextRequest): boolean {
  return isValidCronSecret(request.headers.get("authorization"));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!validateCronAuth(request)) {
      console.error("[IDEAS_CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isoWeek = getIsoWeekString();

    const alreadyRan = await hasGenerationRunThisWeek(isoWeek);
    if (alreadyRan) {
      console.log(`[IDEAS_CRON] Already ran for ${isoWeek}, skipping`);
      return NextResponse.json({ success: true, skipped: true, reason: "already_ran_this_week" });
    }

    // Weekly generation would otherwise pile up unreviewed ideas the admin has not got to yet.
    const pending = await countPendingReviewIdeas();
    if (pending >= MAX_PENDING_REVIEW_IDEAS) {
      console.log(`[IDEAS_CRON] ${pending} idea(s) already await review, not generating more`);
      return NextResponse.json({ success: true, skipped: true, reason: "review_queue_full", pending });
    }

    const sourceArticles = await getRecentHighRelevanceArticles(8);
    if (sourceArticles.length === 0) {
      console.log("[IDEAS_CRON] No high-relevance recent articles, nothing to generate from");
      await recordGenerationRun({
        iso_week: isoWeek,
        status: "no_articles_available",
        idea_id: null,
        detail: "No high-relevance articles available in the lookback window",
      });
      return NextResponse.json({ success: true, skipped: true, reason: "no_articles_available" });
    }

    console.log(`[IDEAS_CRON] Proposing a new idea from ${sourceArticles.length} article(s)`);

    ensureAIProviderInitialized();
    const aiProvider = getAIProvider();
    const existingIdeaTitles = await getAllIdeaTitles();

    let generation;
    try {
      generation = await aiProvider.generateIdea({
        sourceArticles: sourceArticles.map((a) => ({
          title: a.title,
          summary: a.summary ?? a.raw_summary ?? "",
        })),
        existingIdeaTitles,
      });
    } catch (genError) {
      const msg = genError instanceof Error ? genError.message : String(genError);
      const reason = genError instanceof GeminiKeysExhaustedError ? `Gemini keys exhausted (${genError.reason})` : msg;
      console.error(`[IDEAS_CRON] Idea generation failed: ${reason}`);
      await recordGenerationRun({ iso_week: isoWeek, status: "failed", idea_id: null, detail: reason });
      return NextResponse.json({ success: false, error: reason }, { status: 200 });
    }

    if (!generation.title || !generation.pitch || !generation.body) {
      console.error("[IDEAS_CRON] Generation returned an empty field, treating as failed");
      await recordGenerationRun({
        iso_week: isoWeek,
        status: "failed",
        idea_id: null,
        detail: "Empty title, pitch or body returned",
      });
      return NextResponse.json({ success: false, error: "Empty generation result" }, { status: 200 });
    }

    const inserted = await insertIdea({
      title: generation.title,
      pitch: generation.pitch,
      body: generation.body,
      source_article_ids: sourceArticles.map((a) => a.id),
    });

    const duration = Date.now() - startTime;
    console.log(`[IDEAS_CRON] Proposed new idea "${generation.title}" for review in ${duration}ms`);

    await recordGenerationRun({
      iso_week: isoWeek,
      status: "completed",
      idea_id: inserted.id,
      detail: JSON.stringify({ sourceArticleCount: sourceArticles.length }),
    });

    return NextResponse.json({
      success: true,
      ideaId: inserted.id,
      ideaTitle: generation.title,
      durationMs: duration,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[IDEAS_CRON] Unexpected failure: ${errorMsg}`);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
