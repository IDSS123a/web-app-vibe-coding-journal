/**
 * Cron endpoint: /api/cron/university-generate
 * Weekly Vibe-Coding University lesson generation (specs/vibe-coding-
 * university/PLAN.md, confirmed with the Director 2026-09-14).
 * Security: Requires CRON_SECRET header, same pattern as
 * app/api/cron/daily-digest/route.ts.
 *
 * Deliberately its OWN cron, own trigger, own budget -- NOT folded into
 * the daily digest pipeline, which was just stabilized after a real
 * multi-layer outage the same day this feature was planned (PDL-027).
 * Adding more AI call volume to that pipeline would reintroduce exactly
 * the risk just closed. Idempotent per ISO week (university_generation_
 * runs.iso_week, migration 014) -- at most one lesson generated per
 * week, regardless of how many times this endpoint is triggered.
 */

import { NextRequest, NextResponse } from "next/server";
import { ensureAIProviderInitialized } from "@/lib/ai/init";
import { getAIProvider } from "@/lib/ai/ai-provider";
import { GeminiKeysExhaustedError } from "@/lib/ai/gemini-provider";
import { getIsoWeekString } from "@/features/university/domain";
import {
  hasGenerationRunThisWeek,
  getNextStubLesson,
  getUnusedHighRelevanceArticles,
  updateLessonContent,
  recordGenerationRun,
} from "@/features/university/repository";

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" && token === CRON_SECRET;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!validateCronAuth(request)) {
      console.error("[UNIVERSITY_CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isoWeek = getIsoWeekString();

    const alreadyRan = await hasGenerationRunThisWeek(isoWeek);
    if (alreadyRan) {
      console.log(`[UNIVERSITY_CRON] Already ran for ${isoWeek} — skipping`);
      return NextResponse.json({ success: true, skipped: true, reason: "already_ran_this_week" });
    }

    const stub = await getNextStubLesson();
    if (!stub) {
      console.log("[UNIVERSITY_CRON] No stub lessons remaining — nothing to generate");
      await recordGenerationRun({
        iso_week: isoWeek,
        status: "no_stub_available",
        lesson_id: null,
        detail: "All seeded lessons already filled or reviewed",
      });
      return NextResponse.json({ success: true, skipped: true, reason: "no_stub_available" });
    }

    console.log(`[UNIVERSITY_CRON] Generating "${stub.title}" (${stub.course_slug})`);

    ensureAIProviderInitialized();
    const aiProvider = getAIProvider();

    const sourceArticles = await getUnusedHighRelevanceArticles(5);
    // PLAN.md's course.level isn't on the stub row directly (it's a
    // join to courses) -- course_slug doubles as a level identifier
    // here since this project's seed uses the level as the slug
    // (CURRICULUM_DRAFT.md); if that ever changes, this needs a real
    // join instead of this shortcut.
    const courseLevel = (
      stub.course_slug === "beginner" || stub.course_slug === "intermediate" || stub.course_slug === "expert"
        ? stub.course_slug
        : "beginner"
    ) as "beginner" | "intermediate" | "expert";

    let generation;
    try {
      generation = await aiProvider.generateLesson({
        lessonTitle: stub.title,
        courseLevel,
        sourceArticles: sourceArticles.map((a) => ({
          title: a.title,
          summary: a.summary ?? a.raw_summary ?? "",
        })),
      });
    } catch (genError) {
      const msg = genError instanceof Error ? genError.message : String(genError);
      const reason =
        genError instanceof GeminiKeysExhaustedError
          ? `Gemini keys exhausted (${genError.reason})`
          : msg;
      console.error(`[UNIVERSITY_CRON] Generation failed: ${reason}`);
      await recordGenerationRun({
        iso_week: isoWeek,
        status: "failed",
        lesson_id: stub.id,
        detail: reason,
      });
      return NextResponse.json({ success: false, error: reason }, { status: 200 });
    }

    if (!generation.body) {
      console.error("[UNIVERSITY_CRON] Generation returned an empty body — treating as failed");
      await recordGenerationRun({
        iso_week: isoWeek,
        status: "failed",
        lesson_id: stub.id,
        detail: "Empty body returned",
      });
      return NextResponse.json({ success: false, error: "Empty generation result" }, { status: 200 });
    }

    await updateLessonContent(stub.id, {
      body: generation.body,
      status: "pending_review",
      source_article_ids: sourceArticles.map((a) => a.id),
      candidate_terms: generation.terms,
    });

    // Candidate terms travel WITH the lesson row (candidate_terms,
    // migration 015) and are only added to the public Dictionary when
    // the admin approves this lesson (POST /api/admin/university/
    // [lessonId]/review) -- never at generation time, so a rejected
    // lesson can never leave an orphaned term behind.
    const duration = Date.now() - startTime;
    console.log(
      `[UNIVERSITY_CRON] Generated "${stub.title}" for review in ${duration}ms, ${generation.terms.length} candidate term(s)`,
    );

    await recordGenerationRun({
      iso_week: isoWeek,
      status: "completed",
      lesson_id: stub.id,
      detail: JSON.stringify({ candidateTerms: generation.terms, sourceArticleCount: sourceArticles.length }),
    });

    return NextResponse.json({
      success: true,
      lessonId: stub.id,
      lessonTitle: stub.title,
      candidateTerms: generation.terms,
      durationMs: duration,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[UNIVERSITY_CRON] Unexpected failure: ${errorMsg}`);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
