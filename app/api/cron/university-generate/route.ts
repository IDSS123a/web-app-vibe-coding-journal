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
 *
 * Two modes, tried in order (PDL-042, specs/vibe-coding-university/
 * SPEC.md Amendment "Autonomous supplementary growth"):
 *   1. STUB RETRY -- a previously-generated lesson that was rejected in
 *      admin review reverts to status='stub' (features/university/
 *      repository.ts reviewLesson) and keeps its slot; retry it first,
 *      exactly as this cron always has.
 *   2. NEW SUPPLEMENTARY TOPIC -- the fixed 75-lesson core (PDL-035/037)
 *      is complete, so once there's nothing left to retry, propose an
 *      entirely new supplementary lesson from unused high-relevance
 *      articles instead of stopping. Still gated by the same
 *      pending_review -> admin-approve flow; nothing here publishes
 *      unreviewed.
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
  getAllLessonTitles,
  getCourseIdByLevel,
  updateLessonContent,
  insertSupplementaryLesson,
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
    if (stub) {
      return await runStubRetry(isoWeek, startTime, stub);
    }

    return await runNewSupplementaryLesson(isoWeek, startTime);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[UNIVERSITY_CRON] Unexpected failure: ${errorMsg}`);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

/** Mode 1: retry a previously-rejected supplementary lesson (unchanged behavior). */
async function runStubRetry(
  isoWeek: string,
  startTime: number,
  stub: NonNullable<Awaited<ReturnType<typeof getNextStubLesson>>>,
) {
  console.log(`[UNIVERSITY_CRON] Retrying stub "${stub.title}" (${stub.course_slug})`);

  ensureAIProviderInitialized();
  const aiProvider = getAIProvider();

  const sourceArticles = await getUnusedHighRelevanceArticles(5);
  // PLAN.md's course.level isn't on the stub row directly (it's a join
  // to courses) -- course_slug doubles as a level identifier here since
  // this project's seed uses the level as the slug (CURRICULUM_DRAFT.md);
  // if that ever changes, this needs a real join instead of this shortcut.
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
    const reason = genError instanceof GeminiKeysExhaustedError ? `Gemini keys exhausted (${genError.reason})` : msg;
    console.error(`[UNIVERSITY_CRON] Stub retry generation failed: ${reason}`);
    await recordGenerationRun({ iso_week: isoWeek, status: "failed", lesson_id: stub.id, detail: reason });
    return NextResponse.json({ success: false, error: reason }, { status: 200 });
  }

  if (!generation.body) {
    console.error("[UNIVERSITY_CRON] Stub retry returned an empty body — treating as failed");
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
  // migration 015) and are only added to the public Dictionary when the
  // admin approves this lesson (POST /api/admin/university/[lessonId]/
  // review) -- never at generation time, so a rejected lesson can never
  // leave an orphaned term behind.
  const duration = Date.now() - startTime;
  console.log(
    `[UNIVERSITY_CRON] Regenerated "${stub.title}" for review in ${duration}ms, ${generation.terms.length} candidate term(s)`,
  );

  await recordGenerationRun({
    iso_week: isoWeek,
    status: "completed",
    lesson_id: stub.id,
    detail: JSON.stringify({
      mode: "stub_retry",
      candidateTerms: generation.terms,
      sourceArticleCount: sourceArticles.length,
    }),
  });

  return NextResponse.json({
    success: true,
    mode: "stub_retry",
    lessonId: stub.id,
    lessonTitle: stub.title,
    candidateTerms: generation.terms,
    durationMs: duration,
  });
}

/** Mode 2: propose and write an entirely new supplementary lesson (PDL-042). */
async function runNewSupplementaryLesson(isoWeek: string, startTime: number) {
  const sourceArticles = await getUnusedHighRelevanceArticles(5);
  if (sourceArticles.length === 0) {
    console.log("[UNIVERSITY_CRON] No stub to retry and no unused high-relevance articles — nothing to generate");
    await recordGenerationRun({
      iso_week: isoWeek,
      status: "no_stub_available",
      lesson_id: null,
      detail: "No stub to retry and no unused high-relevance articles available for a new supplementary lesson",
    });
    return NextResponse.json({ success: true, skipped: true, reason: "no_articles_available" });
  }

  console.log(`[UNIVERSITY_CRON] Proposing a new supplementary lesson from ${sourceArticles.length} article(s)`);

  ensureAIProviderInitialized();
  const aiProvider = getAIProvider();
  const existingLessonTitles = await getAllLessonTitles();

  let generation;
  try {
    generation = await aiProvider.generateSupplementaryLesson({
      sourceArticles: sourceArticles.map((a) => ({
        title: a.title,
        summary: a.summary ?? a.raw_summary ?? "",
      })),
      existingLessonTitles,
    });
  } catch (genError) {
    const msg = genError instanceof Error ? genError.message : String(genError);
    const reason = genError instanceof GeminiKeysExhaustedError ? `Gemini keys exhausted (${genError.reason})` : msg;
    console.error(`[UNIVERSITY_CRON] Supplementary generation failed: ${reason}`);
    await recordGenerationRun({ iso_week: isoWeek, status: "failed", lesson_id: null, detail: reason });
    return NextResponse.json({ success: false, error: reason }, { status: 200 });
  }

  if (!generation.title || !generation.body) {
    console.error("[UNIVERSITY_CRON] Supplementary generation returned an empty title/body — treating as failed");
    await recordGenerationRun({
      iso_week: isoWeek,
      status: "failed",
      lesson_id: null,
      detail: "Empty title or body returned",
    });
    return NextResponse.json({ success: false, error: "Empty generation result" }, { status: 200 });
  }

  const courseId = await getCourseIdByLevel(generation.level);
  if (!courseId) {
    // Should be unreachable (generation.level is validated to one of the
    // three seeded course slugs in gemini-provider.ts) -- fail loudly
    // rather than silently dropping a real generated lesson.
    console.error(`[UNIVERSITY_CRON] No course found for classified level "${generation.level}"`);
    await recordGenerationRun({
      iso_week: isoWeek,
      status: "failed",
      lesson_id: null,
      detail: `No course found for classified level "${generation.level}"`,
    });
    return NextResponse.json({ success: false, error: "No matching course for classified level" }, { status: 200 });
  }

  const inserted = await insertSupplementaryLesson({
    courseId,
    title: generation.title,
    body: generation.body,
    source_article_ids: sourceArticles.map((a) => a.id),
    candidate_terms: generation.terms,
  });

  const duration = Date.now() - startTime;
  console.log(
    `[UNIVERSITY_CRON] Proposed new supplementary lesson "${generation.title}" (${generation.level}) for review in ${duration}ms, ${generation.terms.length} candidate term(s)`,
  );

  await recordGenerationRun({
    iso_week: isoWeek,
    status: "completed",
    lesson_id: inserted.id,
    detail: JSON.stringify({
      mode: "new_supplementary",
      level: generation.level,
      candidateTerms: generation.terms,
      sourceArticleCount: sourceArticles.length,
    }),
  });

  return NextResponse.json({
    success: true,
    mode: "new_supplementary",
    lessonId: inserted.id,
    lessonTitle: generation.title,
    level: generation.level,
    candidateTerms: generation.terms,
    durationMs: duration,
  });
}
