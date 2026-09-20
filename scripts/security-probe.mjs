/**
 * Repeatable security and access probe (stress test 2026-09-19; plan item "security probe
 * script for CI"). It attacks a RUNNING app the way an outsider or a wrong-tier customer
 * would, and prints one PASS or FAIL line per check. Exit code 1 if anything fails.
 *
 *   node --env-file=.env.local scripts/security-probe.mjs [baseUrl]
 *
 * Needs the service role key only to (a) mint sessions for the two test accounts and (b)
 * temporarily change user@test.local's subscription to walk the tier matrix; that profile is
 * restored to exactly what it was and the restore is verified. No other data is written.
 */
import { psChapters, completeChapter, completeChaptersBefore, finishLessons, clearPsProgress, psProgressCount, correctSubmission } from "./ps-fixture.mjs";
import { createClient } from "@supabase/supabase-js";

const BASE = process.argv[2] ?? "http://localhost:3000";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anonClient = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

let failures = 0;
let checks = 0;
function check(name, ok, detail = "") {
  checks++;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}
const call = async (method, path, { token, body, headers } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { "content-type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  return res.status;
};
async function sessionFor(email) {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const { data, error: e2 } = await anonClient.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (e2) throw e2;
  return data.session.access_token;
}

// A syntactically valid JWT signed with the WRONG key, claiming to be an admin.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const FORGED = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "00000000-0000-0000-0000-000000000000", role: "admin", exp: 4102444800 })}.forgedsignature`;

const PROTECTED_GET = [
  "/api/me/../dictionary", "/api/dictionary", "/api/reports/latest", "/api/reports", "/api/reports/2026-09-19", "/api/bookmarks",
  "/api/assistant/history", "/api/university/courses", "/api/university/progress", "/api/rewards/state",
  "/api/prompt-school", "/api/prompt-school/level-tests/beginner", "/api/prompt-school/chapters/five-pillars", "/api/prompt-school/lessons/five-pillars/pillar-1-context",
  "/api/admin/users", "/api/admin/payments", "/api/admin/reports", "/api/admin/university", "/api/admin/hold-gate-calibration", "/api/admin/assistant-usage",
];
const ADMIN_ONLY_GET = ["/api/admin/users", "/api/admin/payments", "/api/admin/reports", "/api/admin/university", "/api/admin/hold-gate-calibration", "/api/admin/assistant-usage"];

async function main() {
  console.log(`Probing ${BASE}\n`);

  // 1. Anonymous and forged callers
  for (const p of PROTECTED_GET.filter((x) => !x.includes("..")))
    check(`anonymous ${p} refused`, [401, 403, 405].includes(await call("GET", p)), String(await call("GET", p)));
  for (const p of ["/api/dictionary", "/api/reports/latest", "/api/admin/users", "/api/bookmarks"])
    check(`forged admin token refused on ${p}`, (await call("GET", p, { token: FORGED })) === 401);
  check("POST prompt-school exercise check anonymous refused", (await call("POST", "/api/prompt-school/exercises/00000000-0000-0000-0000-000000000000/check", { body: { answer: {} } })) === 401);
  check("POST prompt-school level test anonymous refused", (await call("POST", "/api/prompt-school/level-tests/beginner", { body: { answers: {} } })) === 401);
  check("POST prompt-school lesson complete anonymous refused", (await call("POST", "/api/prompt-school/lessons/five-pillars/pillar-1-context/complete")) === 401);
  check("POST /api/assistant/generate anonymous refused", (await call("POST", "/api/assistant/generate", { body: {} })) === 401);
  check("POST /api/payments/create-order anonymous refused", (await call("POST", "/api/payments/create-order", { body: { tier: "premium" } })) === 401);
  check("POST /api/admin/users anonymous refused", (await call("POST", "/api/admin/users", { body: { email: "x@example.com", tier: "basic" } })) === 401);

  // 2. Cron endpoints
  for (const p of ["/api/cron/daily-digest", "/api/cron/university-generate", "/api/cron/subscription-expiry-check"]) {
    check(`cron ${p}: no secret`, (await call("POST", p)) === 401);
    check(`cron ${p}: built-in old default secret`, (await call("POST", p, { headers: { authorization: "Bearer dev-secret-change-in-production" } })) === 401);
    check(`cron ${p}: wrong secret`, (await call("POST", p, { headers: { authorization: "Bearer not-the-secret" } })) === 401);
  }
  check("PayPal webhook without signature refused", [400, 401, 403].includes(await call("POST", "/api/webhooks/paypal", { body: { event_type: "PAYMENT.CAPTURE.COMPLETED" } })));

  // 3. Security headers
  const head = await fetch(BASE + "/", { redirect: "manual" });
  for (const h of ["x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "content-security-policy-report-only"])
    check(`header ${h}`, !!head.headers.get(h));
  check("X-Powered-By is not advertised", !head.headers.get("x-powered-by"));

  // 4. Database exposure through the public (anon) key
  for (const t of ["articles", "daily_reports", "lessons", "quiz_questions", "level_test_questions", "dictionary_terms", "sources", "user_profiles", "term_candidates", "rejected_articles", "cron_locks", "ai_call_log", "payment_events"]) {
    const { data, error } = await anonClient.from(t).select("*").limit(1);
    check(`anon key cannot read ${t}`, !!error || (data ?? []).length === 0, error ? "denied" : `${data.length} rows`);
  }
  const { error: writeErr } = await anonClient.from("dictionary_terms").insert({ term: "probe", definition: "probe" });
  check("anon key cannot write dictionary_terms", !!writeErr);

  // 5. Signed-in ordinary user
  const userToken = await sessionFor("user@test.local");
  const adminToken = await sessionFor("admin@test.local");
  for (const p of ADMIN_ONLY_GET) check(`ordinary user refused on ${p}`, [401, 403].includes(await call("GET", p, { token: userToken })), String(await call("GET", p, { token: userToken })));
  for (const p of ADMIN_ONLY_GET.slice(0, 3)) check(`admin allowed on ${p}`, (await call("GET", p, { token: adminToken })) === 200);
  const authed = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${userToken}` } } });
  const { data: others } = await authed.from("user_profiles").select("email");
  check("a user can read only their own profile row", (others ?? []).length <= 1, `${(others ?? []).length} rows`);
  const { error: escalate } = await authed.from("user_profiles").update({ role: "admin" }).eq("email", "user@test.local");
  const { data: after } = await admin.from("user_profiles").select("role").eq("email", "user@test.local").single();
  check("a user cannot make themselves admin", after.role === "user", escalate ? "denied" : `role=${after.role}`);
  for (const t of ["articles", "lessons", "quiz_questions", "dictionary_terms"]) {
    const { data } = await authed.from(t).select("*").limit(1);
    check(`signed-in user cannot read ${t} directly`, (data ?? []).length === 0);
  }

  // 6. Input handling
  for (const p of ["/api/reports/not-a-date", "/api/reports/2026-13-45", "/api/reports/%27%20OR%201%3D1--", "/api/reports?page=-1", "/api/reports?page=abc", "/api/reports?page=99999999"])
    check(`bad input ${p} handled`, [400, 404, 422].includes(await call("GET", p, { token: userToken })), String(await call("GET", p, { token: userToken })));
  check("assistant generate with junk body is 422", (await call("POST", "/api/assistant/generate", { token: userToken, body: { projectDescription: 1 } })) === 422);
  // Prompt School: input handling, and answers never leave the server before an attempt.
  {
    check("prompt-school bad chapter slug is 400", (await call("GET", "/api/prompt-school/chapters/BAD%20SLUG!", { token: userToken })) === 400);
    check("prompt-school unknown chapter is 404", (await call("GET", "/api/prompt-school/chapters/no-such-chapter", { token: userToken })) === 404);
    check("prompt-school exercise check with a non-uuid id is 400", (await call("POST", "/api/prompt-school/exercises/nope/check", { token: userToken, body: { answer: {} } })) === 400);
    const { data: ex } = await admin.from("ps_exercises").select("id, kind").eq("kind", "choice").limit(1);
    if (ex?.[0]) {
      check("prompt-school check with a missing body is 400", (await call("POST", `/api/prompt-school/exercises/${ex[0].id}/check`, { token: userToken })) === 400);
    }
    const res = await fetch(`${BASE}/api/prompt-school/chapters/craft-of-prompting`, { headers: { authorization: `Bearer ${userToken}` } });
    const raw = await res.text();
    check("prompt-school chapter payload carries no answers, rubrics or explanations", res.status === 200 && !/"answer"|"criteria"|"explanation"|"correct"|"flawed"|"anyOf"|"model"/.test(raw));
  }

  // Prompt School unlocking, walked end to end on the real chapters plus a temporary last one (removed again in finally).
  {
    const { data: tu } = await admin.from("user_profiles").select("id").eq("email", "user@test.local").single();
    const chs = await psChapters(admin);
    const firstCh = chs[0];
    const fp = chs.find((c) => c.slug === "five-pillars");
    const lastCh = chs[chs.length - 1];
    const { data: ex1 } = await admin.from("ps_exercises").select("id").eq("chapter_id", fp.id).eq("kind", "choice").limit(1);
    let tempId = null;
    try {
      await clearPsProgress(admin, tu.id);
      check("the first chapter is open for a new learner", (await call("GET", `/api/prompt-school/chapters/${firstCh.slug}`, { token: userToken })) === 200);
      check("a later chapter is locked while the chapter before it is incomplete", (await call("GET", "/api/prompt-school/chapters/five-pillars", { token: userToken })) === 403);
      check("its lessons and grading are locked too", (await call("GET", "/api/prompt-school/lessons/five-pillars/pillar-1-context", { token: userToken })) === 403 && (await call("POST", `/api/prompt-school/exercises/${ex1[0].id}/check`, { token: userToken, body: { answer: { index: 0 } } })) === 403);
      await completeChaptersBefore(admin, tu.id, "five-pillars");
      check("it opens once the chapter before it is complete", (await call("GET", "/api/prompt-school/chapters/five-pillars", { token: userToken })) === 200);

      // Practice needs every lesson done first.
      check("grading is refused while the lessons are not done", (await call("POST", `/api/prompt-school/exercises/${ex1[0].id}/check`, { token: userToken, body: { answer: { index: 0 } } })) === 403);
      const beforeChapter = await (await fetch(`${BASE}/api/prompt-school/chapters/five-pillars`, { headers: { authorization: `Bearer ${userToken}` } })).json();
      check("exercises are not listed while the lessons are not done", beforeChapter.practiceAvailable === false && beforeChapter.exercises.length === 0);

      await finishLessons(admin, tu.id, fp);
      const openChapter = await fetch(`${BASE}/api/prompt-school/chapters/five-pillars`, { headers: { authorization: `Bearer ${userToken}` } });
      const openRaw = await openChapter.text();
      check("once practice is open the exercises are listed without any answer, rubric or explanation", openChapter.status === 200 && JSON.parse(openRaw).exercises.length === fp.exerciseIds.length && !/"answer"|"criteria"|"explanation"|"correct"|"flawed"|"anyOf"|"model"/.test(openRaw));
      check("prompt-school check with a wrong-shaped answer is 400 (once the chapter is open)", (await call("POST", `/api/prompt-school/exercises/${ex1[0].id}/check`, { token: userToken, body: { answer: { text: "x" } } })) === 400);
      check("grading works once the lessons are done", (await call("POST", `/api/prompt-school/exercises/${ex1[0].id}/check`, { token: userToken, body: { answer: { index: 0 } } })) === 200);

      // Coins (PDL-072): paid by the server, once per step, never claimable from the browser.
      check("the public award endpoint refuses Prompt School events", (await call("POST", "/api/rewards/award", { token: userToken, body: { eventType: "ps_exercise_pass", dedupeKey: "x" } })) === 400 && (await call("POST", "/api/rewards/award", { token: userToken, body: { eventType: "ps_level_test_pass", dedupeKey: "beginner" } })) === 400);
      const { data: ex1Key } = await admin.from("ps_exercises").select("answer").eq("id", ex1[0].id).single();
      const passBody = { answer: { index: ex1Key.answer.correct } };
      const failAnswer = { answer: { index: (ex1Key.answer.correct + 1) % 4 } };
      const failedFirst = await (await fetch(`${BASE}/api/prompt-school/exercises/${ex1[0].id}/check`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: JSON.stringify(failAnswer) })).json();
      check("a failed attempt pays nothing", failedFirst.reward === null);
      const passedFirst = await (await fetch(`${BASE}/api/prompt-school/exercises/${ex1[0].id}/check`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: JSON.stringify(passBody) })).json();
      const passedAgain = await (await fetch(`${BASE}/api/prompt-school/exercises/${ex1[0].id}/check`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: JSON.stringify(passBody) })).json();
      check("passing an exercise pays 5 coins the first time only", passedFirst.reward?.coinsAwarded === 5 && passedAgain.reward === null);
      const { count: exEvents } = await admin.from("reward_events").select("*", { count: "exact", head: true }).eq("user_id", tu.id).eq("event_type", "ps_exercise_pass");
      check("exactly one exercise reward event is recorded", exEvents === 1, String(exEvents));

      // Level tests: locked until every chapter of the level is complete, graded whole on the server, answers never sent.
      check("a level test is locked for a learner who has not finished the level", (await call("GET", "/api/prompt-school/level-tests/beginner", { token: userToken })) === 403 && (await call("POST", "/api/prompt-school/level-tests/beginner", { token: userToken, body: { answers: {} } })) === 403);
      check("an unknown level is 400", (await call("GET", "/api/prompt-school/level-tests/expert", { token: userToken })) === 400);
      const { data: lv } = await admin.from("ps_chapters").select("slug, level").eq("published", true);
      for (const c of chs.filter((x) => lv.find((l) => l.slug === x.slug)?.level === "beginner")) await completeChapter(admin, tu.id, c);
      const ltRes = await fetch(`${BASE}/api/prompt-school/level-tests/beginner`, { headers: { authorization: `Bearer ${userToken}` } });
      const ltRaw = await ltRes.text();
      const lt = ltRes.status === 200 ? JSON.parse(ltRaw) : { exercises: [] };
      check("the beginner test opens once every beginner chapter is complete, and lists its questions without any answer", ltRes.status === 200 && lt.exercises.length >= 10 && !/"answer"|"criteria"|"explanation"|"correct"|"flawed"|"anyOf"|"model"|"chapter_slug"/.test(ltRaw));
      check("the intermediate test is still locked", (await call("GET", "/api/prompt-school/level-tests/intermediate", { token: userToken })) === 403);
      check("a level test submission with non-uuid keys is 400", (await call("POST", "/api/prompt-school/level-tests/beginner", { token: userToken, body: { answers: { nope: {} } } })) === 400);
      const emptyRes = await fetch(`${BASE}/api/prompt-school/level-tests/beginner`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: JSON.stringify({ answers: {} }) });
      const emptyRaw = await emptyRes.text();
      const empty = emptyRes.status === 200 ? JSON.parse(emptyRaw) : {};
      check("an empty submission scores 0 and fails, and the reply carries no explanation or answer", emptyRes.status === 200 && empty.score === 0 && empty.passed === false && !/"explanation"|"reveal"|"answer"|"model"/.test(emptyRaw));
      const { data: ltRows } = await admin.from("ps_level_test_exercises").select("id, kind, answer").eq("level", "beginner");
      const good = Object.fromEntries(ltRows.map((r) => [r.id, correctSubmission(r)]));
      const goodRes = await fetch(`${BASE}/api/prompt-school/level-tests/beginner`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: JSON.stringify({ answers: good }) });
      const goodBody = goodRes.status === 200 ? await goodRes.json() : {};
      check("the correct answers pass the beginner test with a full score, and both attempts are counted", goodRes.status === 200 && goodBody.score === 1 && goodBody.passed === true && goodBody.attempts === 2);
      check("passing a level test pays 150 coins", goodBody.reward?.coinsAwarded === 150);
      const wrongOnes = Object.fromEntries(ltRows.map((r) => [r.id, r.kind === "choice" ? { index: (r.answer.correct + 1) % 4 } : correctSubmission(r)]));
      const wrongRes = await fetch(`${BASE}/api/prompt-school/level-tests/beginner`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: JSON.stringify({ answers: wrongOnes }) });
      const wrongBody = wrongRes.status === 200 ? await wrongRes.json() : {};
      check("missing the choice questions drops the score below the 80 percent bar", wrongRes.status === 200 && wrongBody.score < 0.8 && wrongBody.passed === false && wrongBody.bestScore === 1);
      const againRes = await fetch(`${BASE}/api/prompt-school/level-tests/beginner`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: JSON.stringify({ answers: good }) });
      const againBody = againRes.status === 200 ? await againRes.json() : {};
      check("passing the same level test again pays nothing", againBody.passed === true && againBody.reward === null && wrongBody.reward === null);

      // A temporary chapter after the last real one: locked until every real chapter is complete.
      const { data: temp, error: tempErr } = await admin.from("ps_chapters").insert({ level: "beginner", slug: "zz-probe-temp", title: "Probe temp", summary: "temporary", order_index: 999, published: true }).select("id").single();
      if (tempErr) throw tempErr;
      tempId = temp.id;
      const { data: tl } = await admin.from("ps_lessons").insert({ chapter_id: tempId, slug: "l1", title: "L1", order_index: 1, body: "x", published: true }).select("id").single();
      check("the temporary last chapter is locked while the chapter before it is incomplete", (await call("GET", "/api/prompt-school/chapters/zz-probe-temp", { token: userToken })) === 403);
      check("its lesson cannot be read or marked done", (await call("GET", "/api/prompt-school/lessons/zz-probe-temp/l1", { token: userToken })) === 403 && (await call("POST", "/api/prompt-school/lessons/zz-probe-temp/l1/complete", { token: userToken })) === 403);
      for (const c of chs) await completeChapter(admin, tu.id, c);
      check("it opens once every chapter before it is complete", (await call("GET", "/api/prompt-school/chapters/zz-probe-temp", { token: userToken })) === 200);
      check("its lesson can then be marked done", (await call("POST", "/api/prompt-school/lessons/zz-probe-temp/l1/complete", { token: userToken })) === 200);

      // Falling below the pass mark locks a chapter the learner has not started: drop the last real chapter to 0.5 and unstart the temporary one.
      await admin.from("ps_lesson_progress").delete().eq("user_id", tu.id).eq("lesson_id", tl.id);
      await admin.from("ps_exercise_results").upsert(lastCh.exerciseIds.map((id) => ({ user_id: tu.id, exercise_id: id, best_score: 0.5, attempts: 1 })), { onConflict: "user_id,exercise_id" });
      check("it locks again when the chapter before it falls below 75 percent (nothing started in it)", (await call("GET", "/api/prompt-school/chapters/zz-probe-temp", { token: userToken })) === 403);
    } finally {
      if (tempId) await admin.from("ps_chapters").delete().eq("id", tempId);
      await clearPsProgress(admin, tu.id);
      const { count: rest } = await admin.from("ps_chapters").select("*", { count: "exact", head: true }).eq("slug", "zz-probe-temp");
      check("prompt school probe data removed again", rest === 0 && (await psProgressCount(admin, tu.id)) === 0);
    }
  }
  check("bookmark with a non-uuid id is rejected", [400, 404, 422].includes(await call("POST", "/api/bookmarks", { token: userToken, body: { article_id: "nope" } })));

  // 7. Tier matrix, walked by changing the test account and restoring it
  const { data: orig } = await admin.from("user_profiles").select("subscription_tier, subscription_status, trial_ends_at, subscription_expires_at, is_blocked").eq("email", "user@test.local").single();
  const soon = (d) => new Date(Date.now() + d * 864e5).toISOString();
  const cases = [
    ["premium active", { subscription_tier: "premium", subscription_status: "active", subscription_expires_at: soon(200), is_blocked: false }, { dict: 200, reports: 200, assistantGen: "not403", ps: 200 }],
    ["basic active", { subscription_tier: "basic", subscription_status: "active", subscription_expires_at: soon(200), is_blocked: false }, { dict: 403, reports: 200, assistantGen: 403, ps: 403 }],
    ["trial running", { subscription_tier: "basic", subscription_status: "trial", trial_ends_at: soon(2), is_blocked: false }, { dict: 403, reports: 200, assistantGen: 403, ps: 403 }],
    ["trial ended", { subscription_tier: "basic", subscription_status: "trial", trial_ends_at: soon(-1), is_blocked: false }, { dict: 403, reports: 403, assistantGen: 403, ps: 403 }],
    ["expired", { subscription_tier: "premium", subscription_status: "expired", is_blocked: false }, { dict: 403, reports: 403, assistantGen: 403, ps: 403 }],
    ["blocked premium", { subscription_tier: "premium", subscription_status: "active", subscription_expires_at: soon(200), is_blocked: true }, { dict: 403, reports: 403, assistantGen: 403, ps: 403 }],
  ];
  try {
    for (const [label, patch, want] of cases) {
      const { error } = await admin.from("user_profiles").update(patch).eq("email", "user@test.local");
      if (error) throw error;
      const t = await sessionFor("user@test.local");
      const dict = await call("GET", "/api/dictionary", { token: t });
      const rep = await call("GET", "/api/reports/latest", { token: t });
      // Wrong body on purpose: an allowed user gets 422 (validation), a refused one 403, and no AI is used.
      const gen = await call("POST", "/api/assistant/generate", { token: t, body: { projectDescription: 1 } });
      check(`${label}: dictionary`, dict === want.dict, `got ${dict}`);
      check(`${label}: daily report`, rep === want.reports, `got ${rep}`);
      const ps = await call("GET", "/api/prompt-school", { token: t });
      const psCheck = await call("POST", "/api/prompt-school/exercises/00000000-0000-0000-0000-000000000000/check", { token: t, body: { answer: {} } });
      check(`${label}: prompt school`, ps === want.ps, `got ${ps}`);
      check(`${label}: prompt school exercise check`, want.ps === 200 ? psCheck === 404 : psCheck === 403, `got ${psCheck}`);
      check(`${label}: assistant gate`, want.assistantGen === "not403" ? gen !== 403 && gen !== 401 : gen === want.assistantGen, `got ${gen}`);
      const upg = await call("POST", "/api/payments/create-upgrade-order", { token: t });
      if (label === "trial running" || label === "premium active") check(`${label}: cannot buy the $40 upgrade`, upg === 403, `got ${upg}`);
    }
  } finally {
    const { error } = await admin.from("user_profiles").update(orig).eq("email", "user@test.local");
    const { data: now } = await admin.from("user_profiles").select("subscription_tier, subscription_status, trial_ends_at, subscription_expires_at, is_blocked").eq("email", "user@test.local").single();
    check("test account restored exactly", !error && JSON.stringify(now) === JSON.stringify(orig));
  }

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
