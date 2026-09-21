/**
 * The person's own data: a full copy for download, and erasure (GDPR articles 15, 17 and 20, PDL-079).
 * Both are keyed by the verified caller's id and nothing else; the routes check who is asking first.
 *
 * Erasure removes the sign-in account, and every table the person owns cascades away with it (bookmarks, progress, results,
 * badges, certificates, history, rewards, sandbox counts). Payment records stay (accounting and tax law) but no longer point at the
 * person (migration 036, "set null").
 */
import { supabaseAdmin } from "@/lib/db/client";

function db() {
  if (!supabaseAdmin) throw new Error("Admin client not available");
  return supabaseAdmin;
}

async function rows(table: string, columns: string, userId: string) {
  const { data, error } = await db().from(table).select(columns).eq("user_id", userId);
  if (error) throw new Error(`Export failed for ${table}: ${error.message}`);
  return data ?? [];
}

/** Everything the service holds about one person, as plain JSON. The raw PayPal payloads are not included; the payment facts are. */
export async function exportUserData(userId: string, email: string) {
  const d = db();
  const [{ data: profile, error: pe }, payments, generations] = await Promise.all([
    d
      .from("user_profiles")
      .select("email, role, tools_used, depth_preference, other_tools_freetext, subscription_status, subscription_tier, trial_started_at, trial_ends_at, subscription_expires_at, terms_accepted_at, coin_balance, level, current_streak, longest_streak, last_active_date, created_at")
      .eq("id", userId)
      .maybeSingle(),
    d.from("payment_events").select("paypal_event_id, event_type, tier, amount_usd, status, created_at").eq("user_id", userId).order("created_at"),
    d
      .from("prompt_blueprint_generations")
      .select("id, wizard_answers, domain, scenario, goal, explanation, prompt_blueprint, mermaid_diagram, next_steps, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at"),
  ]);
  if (pe) throw new Error(`Export failed for profile: ${pe.message}`);
  if (payments.error) throw new Error(`Export failed for payments: ${payments.error.message}`);
  if (generations.error) throw new Error(`Export failed for assistant history: ${generations.error.message}`);

  const [bookmarks, courseProgress, chapterQuizzes, levelTests, psLessons, psExercises, psLevelTests, badges, rewards, certificates] = await Promise.all([
    rows("bookmarks", "article_id, created_at", userId),
    rows("course_progress", "*", userId),
    rows("chapter_quiz_attempts", "*", userId),
    rows("level_test_attempts", "*", userId),
    rows("ps_lesson_progress", "*", userId),
    rows("ps_exercise_results", "*", userId),
    rows("ps_level_test_attempts", "level, score, passed, created_at", userId),
    rows("user_badges", "badge_id, awarded_at", userId),
    rows("reward_events", "event_type, coins_awarded, created_at", userId),
    rows("certificates", "kind, code, issued_at", userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    notice: "This is a copy of the personal data Vibe-Coding Journal holds about you. Passwords are not included because they are stored only as one-way hashes.",
    account: { email, ...(profile ?? {}) },
    payments: payments.data ?? [],
    assistantHistory: generations.data ?? [],
    bookmarks,
    university: { courseProgress, chapterQuizzes, levelTests },
    promptSchool: { lessonsDone: psLessons, exerciseResults: psExercises, levelTests: psLevelTests },
    badges,
    certificates,
    coinEvents: rewards,
  };
}

/** Deletes the sign-in account; all owned data cascades. Returns false when the account was already gone. */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  const { error } = await db().auth.admin.deleteUser(userId);
  if (error) {
    if (/not found/i.test(error.message)) return false;
    throw new Error(`Failed to delete account: ${error.message}`);
  }
  return true;
}
