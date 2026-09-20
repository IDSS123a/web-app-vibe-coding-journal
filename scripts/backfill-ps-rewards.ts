/**
 * One-time backfill of Prompt School coins (PDL-072) for progress made before the payouts existed.
 *
 *   npx tsx --env-file=.env.local scripts/backfill-ps-rewards.ts            (dry run: prints what would be paid)
 *   npx tsx --env-file=.env.local scripts/backfill-ps-rewards.ts --apply    (pays it)
 *
 * Pays exactly what the routes would have paid, with the same dedupe keys, so it is idempotent and it cannot
 * double pay a step the routes already rewarded: 5 per finished lesson, 5 per exercise passed (best score at
 * least 75 percent), 50 per complete chapter, 150 per level test passed. The two test accounts are skipped.
 * Every row is marked `backfill: true` in its metadata so it can be told apart from a live award.
 */
import { createClient } from "@supabase/supabase-js";
import { COIN_AWARDS, levelForCoinBalance } from "../features/rewards/domain";
import { chapterScore, isChapterComplete, isPracticeAvailable } from "../features/prompt-school/domain";

const apply = process.argv.includes("--apply");
const TEST_EMAILS = new Set(["user@test.local", "admin@test.local"]);

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const [{ data: users }, { data: chapters }, { data: lessons }, { data: exercises }, { data: lp }, { data: er }, { data: lt }, { data: events }] = await Promise.all([
    db.from("user_profiles").select("id, email, coin_balance"),
    db.from("ps_chapters").select("id, slug").eq("published", true),
    db.from("ps_lessons").select("id, chapter_id"),
    db.from("ps_exercises").select("id, chapter_id"),
    db.from("ps_lesson_progress").select("user_id, lesson_id"),
    db.from("ps_exercise_results").select("user_id, exercise_id, best_score"),
    db.from("ps_level_test_attempts").select("user_id, level, passed"),
    db.from("reward_events").select("user_id, event_type, metadata").in("event_type", ["ps_lesson_complete", "ps_exercise_pass", "ps_chapter_complete", "ps_level_test_pass"]),
  ]);

  const paidKeys = new Set((events ?? []).map((e) => `${e.user_id}|${e.event_type}|${(e.metadata as { dedupeKey?: string })?.dedupeKey}`));
  const mask = (email: string) => email.replace(/^(.).*@/, "$1***@");
  let grandTotal = 0;

  for (const u of users ?? []) {
    if (TEST_EMAILS.has(u.email)) continue;
    const doneLessons = new Set((lp ?? []).filter((r) => r.user_id === u.id).map((r) => r.lesson_id as string));
    const best: Record<string, number> = {};
    for (const r of (er ?? []).filter((x) => x.user_id === u.id)) best[r.exercise_id as string] = Number(r.best_score);
    if (doneLessons.size === 0 && Object.keys(best).length === 0 && !(lt ?? []).some((a) => a.user_id === u.id)) continue;

    const pending: Array<{ event: keyof typeof COIN_AWARDS; key: string }> = [];
    for (const id of doneLessons) pending.push({ event: "ps_lesson_complete", key: id });
    for (const [id, score] of Object.entries(best)) if (score >= 0.75) pending.push({ event: "ps_exercise_pass", key: id });
    for (const c of chapters ?? []) {
      const lessonIds = (lessons ?? []).filter((l) => l.chapter_id === c.id).map((l) => l.id as string);
      const exerciseIds = (exercises ?? []).filter((e) => e.chapter_id === c.id).map((e) => e.id as string);
      if (isChapterComplete(isPracticeAvailable(lessonIds, doneLessons), exerciseIds.length, chapterScore(best, exerciseIds))) pending.push({ event: "ps_chapter_complete", key: c.slug as string });
    }
    for (const level of new Set((lt ?? []).filter((a) => a.user_id === u.id && a.passed).map((a) => a.level as string))) pending.push({ event: "ps_level_test_pass", key: level });

    const todo = pending.filter((p) => !paidKeys.has(`${u.id}|${p.event}|${p.key}`));
    const coins = todo.reduce((n, p) => n + COIN_AWARDS[p.event], 0);
    const counts = todo.reduce<Record<string, number>>((m, p) => ({ ...m, [p.event]: (m[p.event] ?? 0) + 1 }), {});
    const newBalance = u.coin_balance + coins;
    console.log(`${mask(u.email)}: ${todo.length} steps, +${coins} coins (${u.coin_balance} to ${newBalance}, level ${levelForCoinBalance(u.coin_balance)} to ${levelForCoinBalance(newBalance)}) ${JSON.stringify(counts)}`);
    grandTotal += coins;
    if (!apply || todo.length === 0) continue;

    const rows = todo.map((p) => ({ user_id: u.id, event_type: p.event, coins_awarded: COIN_AWARDS[p.event], metadata: { dedupeKey: p.key, backfill: true } }));
    const { error: insErr } = await db.from("reward_events").insert(rows);
    if (insErr) throw new Error(`Insert failed for ${mask(u.email)}: ${insErr.message}`);
    const { error: updErr } = await db.from("user_profiles").update({ coin_balance: newBalance, level: levelForCoinBalance(newBalance) }).eq("id", u.id);
    if (updErr) throw new Error(`Balance update failed for ${mask(u.email)}: ${updErr.message}`);
  }
  console.log(apply ? `\nPaid ${grandTotal} coins in total.` : `\nDry run: ${grandTotal} coins would be paid. Run again with --apply.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
