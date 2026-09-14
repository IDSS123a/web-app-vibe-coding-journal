import { supabaseAdmin } from "@/lib/db/client";
import type { Course, Lesson, CourseProgress } from "@/lib/validation/schemas";

export async function getAllCourses(): Promise<Course[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin.from("courses").select("*").order("order_index");
  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
  return data as Course[];
}

export async function getPublishedLessonsForCourse(courseId: string): Promise<Lesson[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("order_index");
  if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
  return data as Lesson[];
}

export async function getLessonBySlug(courseId: string, lessonSlug: string): Promise<Lesson | null> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .eq("slug", lessonSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch lesson: ${error.message}`);
  return (data as Lesson) || null;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin.from("courses").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to fetch course: ${error.message}`);
  return (data as Course) || null;
}

export async function getUserProgress(userId: string): Promise<CourseProgress[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin.from("course_progress").select("*").eq("user_id", userId);
  if (error) throw new Error(`Failed to fetch course progress: ${error.message}`);
  return data as CourseProgress[];
}

/**
 * Marks a lesson complete for a user, idempotently (re-marking an
 * already-completed lesson is a no-op, not an error) -- upserts the
 * course_progress row and appends the lesson id if not already present.
 */
export async function markLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string,
): Promise<CourseProgress> {
  if (!supabaseAdmin) throw new Error("Admin client not available");

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("course_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch course progress: ${fetchError.message}`);

  const completed: string[] = existing?.lessons_completed ?? [];
  const alreadyDone = completed.includes(lessonId);
  const newCompleted = alreadyDone ? completed : [...completed, lessonId];

  const { data, error } = await supabaseAdmin
    .from("course_progress")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        lessons_completed: newCompleted,
        status: "in_progress", // Caller (the API route) recomputes the precise status via domain.ts
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to update course progress: ${error.message}`);
  return data as CourseProgress;
}

/**
 * The next lesson still waiting for content — lowest order_index
 * 'stub' lesson across ALL courses, ordered by course order_index then
 * lesson order_index, so the beginner course fills in before
 * intermediate/expert (PLAN.md's stub-filling design). Used by the
 * weekly generation cron (app/api/cron/university-generate/route.ts).
 */
export async function getNextStubLesson(): Promise<(Lesson & { course_slug: string }) | null> {
  if (!supabaseAdmin) throw new Error("Admin client not available");

  const { data, error } = await supabaseAdmin
    .from("lessons")
    .select("*, courses!inner(slug, order_index)")
    .eq("status", "stub")
    .order("order_index", { referencedTable: "courses", ascending: true })
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch next stub lesson: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as Lesson & { courses: { slug: string; order_index: number } };
  const { courses, ...lesson } = row;
  return { ...lesson, course_slug: courses.slug };
}

export async function updateLessonContent(
  lessonId: string,
  fields: {
    body: string;
    status: "pending_review";
    source_article_ids: string[];
    candidate_terms: Array<{ term: string; definition: string }>;
  },
): Promise<void> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { error } = await supabaseAdmin
    .from("lessons")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw new Error(`Failed to update lesson content: ${error.message}`);
}

export async function getPendingReviewLessons(): Promise<Lesson[]> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("lessons")
    .select("*")
    .eq("status", "pending_review")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch pending-review lessons: ${error.message}`);
  return data as Lesson[];
}

export async function reviewLesson(
  lessonId: string,
  decision: "published" | "stub", // 'stub' = rejected, reverts to unwritten (keeps the slot, tries again later)
  reviewerId: string,
): Promise<void> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const update =
    decision === "published"
      ? { status: "published", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }
      : {
          status: "stub",
          body: null,
          source_article_ids: [],
          candidate_terms: [],
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        };
  const { error } = await supabaseAdmin
    .from("lessons")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", lessonId);
  if (error) throw new Error(`Failed to review lesson: ${error.message}`);
}

/**
 * Source material for the weekly generation job: the most relevant
 * recent articles that haven't already been used as source material
 * for an earlier lesson. Filters out already-used articles in JS
 * (fetching all existing source_article_ids and excluding them) rather
 * than a Postgres array-overlap query -- this table stays small (at
 * most one row added per week), so the extra round trip costs nothing
 * real and keeps the query simple.
 */
export async function getUnusedHighRelevanceArticles(limit = 5): Promise<Array<{ id: string; title: string; summary: string | null; raw_summary: string | null }>> {
  if (!supabaseAdmin) throw new Error("Admin client not available");

  const { data: usedRows, error: usedError } = await supabaseAdmin
    .from("lessons")
    .select("source_article_ids");
  if (usedError) throw new Error(`Failed to fetch used article ids: ${usedError.message}`);
  const usedIds = new Set((usedRows ?? []).flatMap((r) => (r.source_article_ids as string[]) ?? []));

  const sinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id, title, summary, raw_summary, relevance_score")
    .is("duplicate_of", null)
    .gte("published_at", sinceIso)
    .gte("relevance_score", 70)
    .order("relevance_score", { ascending: false })
    .limit(limit + usedIds.size); // over-fetch a bit to absorb exclusions

  if (error) throw new Error(`Failed to fetch source articles: ${error.message}`);

  return (data ?? [])
    .filter((a) => !usedIds.has(a.id as string))
    .slice(0, limit)
    .map((a) => ({
      id: a.id as string,
      title: a.title as string,
      summary: a.summary as string | null,
      raw_summary: a.raw_summary as string | null,
    }));
}

/**
 * Found live 2026-09-14/15: this originally checked for ANY row this
 * ISO week regardless of status, which meant a single FAILED attempt
 * (e.g. a Gemini parse error) silently blocked every retry until next
 * Monday -- confirmed live when the very first real generation run
 * failed and a manual re-trigger reported "already ran this week"
 * despite never actually producing a lesson. Only a COMPLETED run
 * should count as "done" for the week; failed/no-stub-available
 * attempts must allow retry the same week.
 */
export async function hasGenerationRunThisWeek(isoWeek: string): Promise<boolean> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { data, error } = await supabaseAdmin
    .from("university_generation_runs")
    .select("id")
    .eq("iso_week", isoWeek)
    .eq("status", "completed")
    .maybeSingle();
  if (error) throw new Error(`Failed to check generation run: ${error.message}`);
  return !!data;
}

export async function recordGenerationRun(payload: {
  iso_week: string;
  status: "completed" | "failed" | "no_stub_available";
  lesson_id: string | null;
  detail: string | null;
}): Promise<void> {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  const { error } = await supabaseAdmin.from("university_generation_runs").insert(payload);
  if (error) throw new Error(`Failed to record generation run: ${error.message}`);
}
