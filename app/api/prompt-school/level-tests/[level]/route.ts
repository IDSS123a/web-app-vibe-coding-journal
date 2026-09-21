/**
 * GET  /api/prompt-school/level-tests/[level]: the level's test questions (never the answers), only when every
 *      chapter of the level is complete.
 * POST /api/prompt-school/level-tests/[level]  body { answers: { [exerciseId]: submission } }: grades the whole
 *      test in one sitting on the server and records the attempt. The reply carries the score and which
 *      questions were missed (with the chapter to review), but never the explanations or correct answers,
 *      so a retake cannot be passed by memorising a reveal. Deterministic grading, no AI request. Premium-only.
 * E-6: authenticate, authorize, validate, execute, return.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { PASS_SCORE, gradeExercise, levelTestPassed, levelTestScore, toPublicExercise, type PromptSchoolLevel } from "@/features/prompt-school/domain";
import { getLevelTestStates } from "@/features/prompt-school/progress";
import { getLevelTestExercises, recordLevelTestAttempt } from "@/features/prompt-school/repository";
import { awardPromptSchool } from "@/features/prompt-school/rewards";
import { grantNewBadges } from "@/features/badges/award";
import { promptSchoolLevelBadge } from "@/features/badges/domain";
import { PROMPT_SCHOOL_OUTLINE } from "@/features/prompt-school/content/outline";

const LEVELS: PromptSchoolLevel[] = ["beginner", "intermediate", "advanced"];
const bodySchema = z.object({ answers: z.record(z.string().uuid(), z.unknown()) });

function parseLevel(value: string): PromptSchoolLevel | null {
  return (LEVELS as string[]).includes(value) ? (value as PromptSchoolLevel) : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ level: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;
    const level = parseLevel((await params).level);
    if (!level) return NextResponse.json({ error: "Invalid level" }, { status: 400 });

    const state = (await getLevelTestStates(auth.user.sub)).find((s) => s.level === level);
    if (!state || state.questionCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!state.unlocked) return NextResponse.json({ error: "Level test locked", remainingChapters: state.remainingChapters }, { status: 403 });

    const exercises = await getLevelTestExercises(level);
    return NextResponse.json({
      level,
      passScore: state.passScore,
      attempts: state.attempts,
      bestScore: state.bestScore,
      passed: state.passed,
      exercises: exercises.map((e) => toPublicExercise(e)),
    });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error fetching level test: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch the level test" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ level: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;
    const level = parseLevel((await params).level);
    if (!level) return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success || Object.keys(body.data.answers).length > 60) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const state = (await getLevelTestStates(auth.user.sub)).find((s) => s.level === level);
    if (!state || state.questionCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!state.unlocked) return NextResponse.json({ error: "Level test locked", remainingChapters: state.remainingChapters }, { status: 403 });

    const exercises = await getLevelTestExercises(level);
    const results = exercises.map((e) => {
      const graded = e.id in body.data.answers ? gradeExercise(e, body.data.answers[e.id]) : null;
      return { exerciseId: e.id, score: graded?.score ?? 0 };
    });
    const score = levelTestScore(results.map((r) => r.score), exercises.length);
    const passed = levelTestPassed(score);
    await recordLevelTestAttempt(auth.user.sub, level, score, passed, results);
    // 150 coins the first time the level test is passed (PDL-072); retakes never pay again.
    const reward = passed ? await awardPromptSchool(auth.user.sub, "ps_level_test_pass", level) : null;
    const badges = passed ? await grantNewBadges(auth.user.sub, [promptSchoolLevelBadge(level)]) : [];

    const chapterTitle = (slug: string) => PROMPT_SCHOOL_OUTLINE.find((c) => c.slug === slug)?.title ?? slug;
    return NextResponse.json({
      reward,
      badges,
      score,
      passed,
      passScore: state.passScore,
      attempts: state.attempts + 1,
      bestScore: Math.max(state.bestScore, score),
      questions: exercises.map((e, i) => ({
        id: e.id,
        title: e.title,
        score: results[i]?.score ?? 0,
        correct: (results[i]?.score ?? 0) >= PASS_SCORE,
        chapterSlug: e.chapter_slug,
        chapterTitle: chapterTitle(e.chapter_slug),
      })),
    });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error grading level test: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to grade the level test" }, { status: 500 });
  }
}
