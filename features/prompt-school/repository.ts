import { supabaseAdmin } from "@/lib/db/client";
import type { PromptSchoolLevel, StoredExercise } from "./domain";

export interface PsChapter {
  id: string;
  level: PromptSchoolLevel;
  slug: string;
  title: string;
  summary: string;
  order_index: number;
  published: boolean;
  book_ref: string | null;
}

export interface PsLesson {
  id: string;
  chapter_id: string;
  slug: string;
  title: string;
  order_index: number;
  minutes: number;
  body: string;
}

export interface PsExerciseRow extends StoredExercise {
  chapter_id: string;
  slug: string;
  order_index: number;
}

function db() {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  return supabaseAdmin;
}

export async function getPublishedChapters(): Promise<PsChapter[]> {
  const { data, error } = await db().from("ps_chapters").select("*").eq("published", true).order("order_index");
  if (error) throw new Error(`Failed to fetch chapters: ${error.message}`);
  return data as PsChapter[];
}

export async function getChapterBySlug(slug: string): Promise<PsChapter | null> {
  const { data, error } = await db().from("ps_chapters").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (error) throw new Error(`Failed to fetch chapter: ${error.message}`);
  return (data as PsChapter) ?? null;
}

/** Lessons of every published chapter (no body), for the overview counts. */
export async function getLessonStubs(): Promise<Array<Pick<PsLesson, "id" | "chapter_id" | "slug" | "title" | "order_index" | "minutes">>> {
  const { data, error } = await db()
    .from("ps_lessons")
    .select("id, chapter_id, slug, title, order_index, minutes")
    .eq("published", true)
    .order("order_index");
  if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
  return data as Array<Pick<PsLesson, "id" | "chapter_id" | "slug" | "title" | "order_index" | "minutes">>;
}

export async function getLessonsForChapter(chapterId: string): Promise<PsLesson[]> {
  const { data, error } = await db().from("ps_lessons").select("*").eq("chapter_id", chapterId).eq("published", true).order("order_index");
  if (error) throw new Error(`Failed to fetch chapter lessons: ${error.message}`);
  return data as PsLesson[];
}

export async function getExercisesForChapter(chapterId: string): Promise<PsExerciseRow[]> {
  const { data, error } = await db().from("ps_exercises").select("*").eq("chapter_id", chapterId).order("order_index");
  if (error) throw new Error(`Failed to fetch exercises: ${error.message}`);
  return data as PsExerciseRow[];
}

/** Every exercise id per chapter, for the overview (ids only, never answers). */
export async function getExerciseStubs(): Promise<Array<{ id: string; chapter_id: string }>> {
  const { data, error } = await db().from("ps_exercises").select("id, chapter_id");
  if (error) throw new Error(`Failed to fetch exercises: ${error.message}`);
  return data as Array<{ id: string; chapter_id: string }>;
}

/** An exercise together with its chapter's published flag, so an unpublished chapter cannot be graded. */
export async function getExerciseForGrading(id: string): Promise<{ exercise: PsExerciseRow; chapter: PsChapter } | null> {
  const { data, error } = await db().from("ps_exercises").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to fetch exercise: ${error.message}`);
  if (!data) return null;
  const exercise = data as PsExerciseRow;
  const { data: ch, error: chErr } = await db().from("ps_chapters").select("*").eq("id", exercise.chapter_id).eq("published", true).maybeSingle();
  if (chErr) throw new Error(`Failed to fetch chapter: ${chErr.message}`);
  if (!ch) return null;
  return { exercise, chapter: ch as PsChapter };
}

export async function getCompletedLessonIds(userId: string): Promise<Set<string>> {
  const { data, error } = await db().from("ps_lesson_progress").select("lesson_id").eq("user_id", userId);
  if (error) throw new Error(`Failed to fetch lesson progress: ${error.message}`);
  return new Set((data as Array<{ lesson_id: string }>).map((r) => r.lesson_id));
}

export async function markLessonDone(userId: string, lessonId: string): Promise<void> {
  const { error } = await db()
    .from("ps_lesson_progress")
    .upsert({ user_id: userId, lesson_id: lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  if (error) throw new Error(`Failed to save lesson progress: ${error.message}`);
}

export async function getBestScores(userId: string): Promise<Record<string, number>> {
  const { data, error } = await db().from("ps_exercise_results").select("exercise_id, best_score").eq("user_id", userId);
  if (error) throw new Error(`Failed to fetch exercise results: ${error.message}`);
  const out: Record<string, number> = {};
  for (const r of data as Array<{ exercise_id: string; best_score: number }>) out[r.exercise_id] = Number(r.best_score);
  return out;
}

/** Stores an attempt: keeps the best score ever reached, counts attempts, remembers the last answer. */
export async function recordAttempt(userId: string, exerciseId: string, score: number, answer: unknown): Promise<{ bestScore: number; attempts: number }> {
  const { data: existing, error: readErr } = await db()
    .from("ps_exercise_results")
    .select("best_score, attempts")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();
  if (readErr) throw new Error(`Failed to read exercise result: ${readErr.message}`);
  const prev = existing as { best_score: number; attempts: number } | null;
  const bestScore = Math.max(score, prev ? Number(prev.best_score) : 0);
  const attempts = (prev?.attempts ?? 0) + 1;
  const { error } = await db()
    .from("ps_exercise_results")
    .upsert(
      { user_id: userId, exercise_id: exerciseId, best_score: bestScore, attempts, last_answer: answer, updated_at: new Date().toISOString() },
      { onConflict: "user_id,exercise_id" },
    );
  if (error) throw new Error(`Failed to save exercise result: ${error.message}`);
  return { bestScore, attempts };
}
