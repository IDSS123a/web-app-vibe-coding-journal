/**
 * Test fixtures for the Prompt School checks (probe, smoke test, responsive audit). Chapters open one
 * after another, so a check that needs chapter N must first complete the chapters before it for the test
 * account, and every script removes that progress again when it is done. Only ever used with the
 * test accounts; never touches another user's progress.
 */

/** Published chapters in course order, each with its lesson and exercise ids. */
export async function psChapters(admin) {
  const { data: chapters } = await admin.from("ps_chapters").select("id, slug, order_index").eq("published", true).order("order_index");
  const { data: lessons } = await admin.from("ps_lessons").select("id, chapter_id");
  const { data: exercises } = await admin.from("ps_exercises").select("id, chapter_id");
  return chapters.map((c) => ({
    ...c,
    lessonIds: lessons.filter((l) => l.chapter_id === c.id).map((l) => l.id),
    exerciseIds: exercises.filter((e) => e.chapter_id === c.id).map((e) => e.id),
  }));
}

/** Marks every lesson of one chapter done and every exercise passed with a perfect score. */
export async function completeChapter(admin, userId, chapter) {
  if (chapter.lessonIds.length > 0) {
    await admin.from("ps_lesson_progress").upsert(chapter.lessonIds.map((id) => ({ user_id: userId, lesson_id: id })), { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  }
  if (chapter.exerciseIds.length > 0) {
    await admin.from("ps_exercise_results").upsert(chapter.exerciseIds.map((id) => ({ user_id: userId, exercise_id: id, best_score: 1, attempts: 1 })), { onConflict: "user_id,exercise_id" });
  }
}

/** Completes every published chapter that comes before `slug`, so that chapter is open. */
export async function completeChaptersBefore(admin, userId, slug) {
  for (const c of await psChapters(admin)) {
    if (c.slug === slug) return;
    await completeChapter(admin, userId, c);
  }
}

/** Marks every lesson of one chapter done, without touching exercises (opens its practice). */
export async function finishLessons(admin, userId, chapter) {
  await admin.from("ps_lesson_progress").upsert(chapter.lessonIds.map((id) => ({ user_id: userId, lesson_id: id })), { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
}

const PS_REWARD_EVENTS = ["ps_lesson_complete", "ps_exercise_pass", "ps_chapter_complete", "ps_level_test_pass", "uni_lesson_complete", "uni_chapter_quiz_pass", "uni_level_test_pass"];
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200];

/** Takes back the coins the Prompt School routes paid to a test account (and the events that record them). */
async function clearPsRewards(admin, userId) {
  // Badges earned through the learning routes (PDL-075) belong to the same test run.
  await admin.from("user_badges").delete().eq("user_id", userId);
  const { data: events } = await admin.from("reward_events").select("id, coins_awarded").eq("user_id", userId).in("event_type", PS_REWARD_EVENTS);
  if (!events || events.length === 0) return;
  const paid = events.reduce((n, e) => n + e.coins_awarded, 0);
  const { data: profile } = await admin.from("user_profiles").select("coin_balance").eq("id", userId).single();
  const balance = Math.max(0, profile.coin_balance - paid);
  const level = LEVEL_THRESHOLDS.reduce((l, t, i) => (balance >= t ? i + 1 : l), 1);
  await admin.from("user_profiles").update({ coin_balance: balance, level }).eq("id", userId);
  await admin.from("reward_events").delete().eq("user_id", userId).in("event_type", PS_REWARD_EVENTS);
}

export async function clearPsProgress(admin, userId) {
  await clearPsRewards(admin, userId);
  await admin.from("ps_level_test_attempts").delete().eq("user_id", userId);
  await admin.from("ps_exercise_results").delete().eq("user_id", userId);
  await admin.from("ps_lesson_progress").delete().eq("user_id", userId);
}

export async function psProgressCount(admin, userId) {
  const a = (await admin.from("ps_exercise_results").select("*", { count: "exact", head: true }).eq("user_id", userId)).count;
  const b = (await admin.from("ps_lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", userId)).count;
  const r = (await admin.from("reward_events").select("*", { count: "exact", head: true }).eq("user_id", userId).in("event_type", PS_REWARD_EVENTS)).count;
  const bdg = (await admin.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", userId)).count;
  const c = (await admin.from("ps_level_test_attempts").select("*", { count: "exact", head: true }).eq("user_id", userId)).count;
  return (a ?? 0) + (b ?? 0) + (c ?? 0) + (r ?? 0) + (bdg ?? 0);
}

/** The submission that answers a stored exercise correctly, built from its answer key (service role only). */
export function correctSubmission(row) {
  const a = row.answer;
  if (row.kind === "choice") return { index: a.correct };
  if (row.kind === "fill") return { values: a.correct };
  if (row.kind === "order") return { order: a.order };
  if (row.kind === "spot") return { picked: a.flawed };
  return { text: a.model };
}
