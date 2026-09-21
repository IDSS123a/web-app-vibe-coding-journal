/**
 * POST /api/prompt-school/exercises/[id]/check  body { answer }: grades one attempt on the server.
 * Only now do the explanation and the correct answer (or model answer) leave the server. The best
 * score per exercise is stored. Deterministic grading, no AI request. Premium-only.
 * Coins (PDL-072) are paid here, on the server: 5 the first time the exercise is passed, and 50 the first
 * time this attempt leaves the whole chapter complete. Both are idempotent, so repeating pays nothing.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePromptSchoolUser } from "@/features/prompt-school/access";
import { gradeExercise } from "@/features/prompt-school/domain";
import { getChapterState, getChapterStates } from "@/features/prompt-school/progress";
import { getExerciseForGrading, recordAttempt } from "@/features/prompt-school/repository";
import { awardPromptSchool } from "@/features/prompt-school/rewards";
import { grantNewBadges } from "@/features/badges/award";

const idSchema = z.string().uuid();
const bodySchema = z.object({ answer: z.unknown() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePromptSchoolUser(request);
    if ("denied" in auth) return auth.denied;

    const id = idSchema.safeParse((await params).id);
    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!id.success || !body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const found = await getExerciseForGrading(id.data);
    if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Same rule as the University quiz: the chapter must be open and every lesson of it done.
    const state = await getChapterState(auth.user.sub, found.chapter.slug);
    if (!state || !state.unlocked) return NextResponse.json({ error: "Chapter locked", waitingFor: state?.waitingFor ?? null }, { status: 403 });
    if (!state.practiceAvailable) return NextResponse.json({ error: "Finish all lessons of this chapter first" }, { status: 403 });

    const result = gradeExercise(found.exercise, body.data.answer);
    if (!result) return NextResponse.json({ error: "Invalid answer" }, { status: 400 });

    const saved = await recordAttempt(auth.user.sub, found.exercise.id, result.score, body.data.answer);

    const reward = result.passed ? await awardPromptSchool(auth.user.sub, "ps_exercise_pass", found.exercise.id) : null;
    const allStates = await getChapterStates(auth.user.sub);
    const after = allStates.find((s) => s.chapter.slug === found.chapter.slug);
    const chapterReward = after?.completed ? await awardPromptSchool(auth.user.sub, "ps_chapter_complete", found.chapter.slug) : null;
    // Badges (PDL-075): the first completed chapter, and finishing the whole course.
    const badges = await grantNewBadges(auth.user.sub, [
      after?.completed ? "first-chapter" : null,
      allStates.length > 0 && allStates.every((s) => s.completed) ? "ps-graduate" : null,
    ]);

    return NextResponse.json({
      reward,
      chapterReward,
      badges,
      chapterComplete: Boolean(after?.completed),
      score: result.score,
      passed: result.passed,
      feedback: result.feedback,
      reveal: result.reveal,
      explanation: found.exercise.explanation,
      bestScore: saved.bestScore,
      attempts: saved.attempts,
    });
  } catch (err) {
    console.error(`[PROMPT-SCHOOL] Error grading exercise: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to check the answer" }, { status: 500 });
  }
}
