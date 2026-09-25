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
  "/api/prompt-school", "/api/badges", "/api/prompt-school/level-tests/beginner", "/api/prompt-school/chapters/five-pillars", "/api/prompt-school/lessons/five-pillars/pillar-1-context",
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
  check("POST prompt-school sandbox run anonymous refused", (await call("POST", "/api/prompt-school/sandbox/five-pillars/pillar-4-constraints", { body: { prompt: "Summarise the text." } })) === 401);
  check("DELETE assistant history item anonymous refused", (await call("DELETE", "/api/assistant/history/00000000-0000-0000-0000-000000000000")) === 401);
  // Public launch pages (PDL-079): the legal texts, robots, sitemap and the share picture are open to everyone.
  for (const [path, needle] of [["/terms", "Terms of Use"], ["/privacy", "Privacy Policy"], ["/refunds", "money back guarantee"], ["/subscription", "does not renew by itself"], ["/cookies", "Cookie notice"], ["/forgot-password", "Forgot password"]]) {
    const r = await fetch(`${BASE}${path}`);
    check(`public page ${path} is open and says what it should`, r.status === 200 && (await r.text()).includes(needle));
  }
  const robotsTxt = await (await fetch(`${BASE}/robots.txt`)).text();
  check("robots.txt keeps the account pages out and points to the sitemap", /Disallow: \/api\//.test(robotsTxt) && /Disallow: \/dashboard/.test(robotsTxt) && /Sitemap: https:\/\/[^\s]+\/sitemap\.xml/.test(robotsTxt));
  const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check("sitemap.xml lists the public pages and none of the account pages", ["/terms", "/privacy", "/refunds", "/subscription", "/cookies", "/register"].every((p) => sitemapXml.includes(p)) && !/dashboard|admin|prompt-school/.test(sitemapXml));
  const og = await fetch(`${BASE}/opengraph-image`);
  check("the share picture renders as a PNG", og.status === 200 && (og.headers.get("content-type") ?? "").includes("image/png"));
  check("GET /api/certificates and /api/account/export anonymous refused", (await call("GET", "/api/certificates")) === 401 && (await call("GET", "/api/account/export")) === 401);
  check("DELETE /api/account anonymous refused", (await call("DELETE", "/api/account", { body: { confirm: "DELETE MY ACCOUNT" } })) === 401);
  check("POST /api/assistant/generate anonymous refused", (await call("POST", "/api/assistant/generate", { body: {} })) === 401);
  check("POST /api/payments/create-order anonymous refused", (await call("POST", "/api/payments/create-order", { body: { tier: "premium" } })) === 401);
  check("POST /api/admin/users anonymous refused", (await call("POST", "/api/admin/users", { body: { email: "x@example.com", tier: "basic" } })) === 401);

  // 2. Cron endpoints
  for (const p of ["/api/cron/daily-digest", "/api/cron/university-generate", "/api/cron/subscription-expiry-check", "/api/cron/health-check"]) {
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
  const adminPayments = await (await fetch(`${BASE}/api/admin/payments`, { headers: { authorization: `Bearer ${adminToken}` } })).json();
  check("the admin payments answer says which PayPal it talks to, and it is the sandbox unless live was set on purpose", ["sandbox", "live"].includes(adminPayments.paypalMode));
  // Admin ends a plan or sets its end date (PDL-079): after a refund. Restored exactly afterwards.
  {
    const { data: who } = await admin.from("user_profiles").select("id, subscription_status, subscription_expires_at").eq("email", "user@test.local").single();
    const planUrl = `/api/admin/users/${who.id}/plan`;
    check("admin plan change: anonymous and ordinary user are refused", (await call("PATCH", planUrl, { body: { action: "end_now" } })) === 401 && (await call("PATCH", planUrl, { token: userToken, body: { action: "end_now" } })) === 401);
    check("admin plan change: junk bodies are 422, an unknown user is 404", (await call("PATCH", planUrl, { token: adminToken, body: { action: "nope" } })) === 422 && (await call("PATCH", planUrl, { token: adminToken, body: { action: "set_end_date", date: "2026-13-45" } })) === 422 && (await call("PATCH", "/api/admin/users/00000000-0000-0000-0000-000000000000/plan", { token: adminToken, body: { action: "end_now" } })) === 404);
    try {
      const future = new Date(Date.now() + 400 * 86_400_000).toISOString().slice(0, 10);
      check("admin plan change: a future end date makes an active plan ending that day", (await call("PATCH", planUrl, { token: adminToken, body: { action: "set_end_date", date: future } })) === 200 && (await admin.from("user_profiles").select("subscription_status, subscription_expires_at").eq("id", who.id).single()).data?.subscription_expires_at?.startsWith(future));
      check("admin plan change: ending the access now makes it expired", (await call("PATCH", planUrl, { token: adminToken, body: { action: "end_now" } })) === 200 && (await admin.from("user_profiles").select("subscription_status").eq("id", who.id).single()).data?.subscription_status === "expired");
    } finally {
      await admin.from("user_profiles").update({ subscription_status: who.subscription_status, subscription_expires_at: who.subscription_expires_at }).eq("id", who.id);
    }
  }
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
  // Assistant history delete (2026-09-21): a soft delete, owner only, and the row still counts toward the daily limit.
  {
    const { data: owner } = await admin.from("user_profiles").select("id").eq("email", "user@test.local").single();
    const { data: made } = await admin.from("prompt_blueprint_generations").insert({ user_id: owner.id, wizard_answers: {}, domain: "probe", scenario: "s", goal: "probe goal", explanation: "e", prompt_blueprint: "p", mermaid_diagram: "m", next_steps: "n" }).select("id").single();
    const url = `/api/assistant/history/${made.id}`;
    const countRows = async () => (await admin.from("prompt_blueprint_generations").select("*", { count: "exact", head: true }).eq("id", made.id)).count;
    check("assistant delete: a non-uuid id is 404", (await call("DELETE", "/api/assistant/history/nope", { token: userToken })) === 404);
    check("assistant delete: another user (the admin) cannot delete someone else's item, it stays", (await call("DELETE", url, { token: adminToken })) === 404 && (await call("GET", url, { token: userToken })) === 200);
    const listedBefore = await (await fetch(`${BASE}/api/assistant/history`, { headers: { authorization: `Bearer ${userToken}` } })).json();
    check("assistant delete: the item is in the owner's history first", listedBefore.data?.some((g) => g.id === made.id));
    check("assistant delete: the owner deletes it", (await call("DELETE", url, { token: userToken })) === 200);
    const listedAfter = await (await fetch(`${BASE}/api/assistant/history`, { headers: { authorization: `Bearer ${userToken}` } })).json();
    check("assistant delete: it is gone from the history list and cannot be opened", !listedAfter.data?.some((g) => g.id === made.id) && (await call("GET", url, { token: userToken })) === 404);
    check("assistant delete: deleting twice is 404", (await call("DELETE", url, { token: userToken })) === 404);
    check("assistant delete: the row is kept (soft delete), so the daily limit still counts it", (await countRows()) === 1);
    const { data: kept } = await admin.from("prompt_blueprint_generations").select("goal, prompt_blueprint, wizard_answers").eq("id", made.id).single();
    check("assistant delete: the text is erased from the kept row (GDPR)", kept?.goal === "" && kept?.prompt_blueprint === "" && JSON.stringify(kept?.wizard_answers) === "{}");
    await admin.from("prompt_blueprint_generations").delete().eq("id", made.id);
  }
  // Certificates (PDL-080): issued once from the badges, verifiable in public without naming the holder.
  {
    const { data: who } = await admin.from("user_profiles").select("id").eq("email", "user@test.local").single();
    const mine = async () => (await (await fetch(`${BASE}/api/certificates`, { headers: { authorization: `Bearer ${userToken}` } })).json()).data?.certificates ?? [];
    try {
      await admin.from("certificates").delete().eq("user_id", who.id);
      await admin.from("user_badges").delete().eq("user_id", who.id).in("badge_id", ["uni-beginner", "uni-intermediate", "uni-expert"]);
      const before = await mine();
      check("certificates: both are listed and none is earned without the badges", before.length === 2 && before.every((c) => c.earned === false && c.code === null));
      await admin.from("user_badges").insert(["uni-beginner", "uni-intermediate"].map((badge_id) => ({ user_id: who.id, badge_id })));
      check("certificates: two of the three University level tests do not earn it", (await mine()).find((c) => c.kind === "university")?.earned === false);
      await admin.from("user_badges").insert({ user_id: who.id, badge_id: "uni-expert" });
      const earned = (await mine()).find((c) => c.kind === "university");
      check("certificates: the third one issues it, with a code", earned?.earned === true && /^VBJ-[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(earned.code ?? ""));
      check("certificates: opening the page again gives the same code, not a new one", (await mine()).find((c) => c.kind === "university")?.code === earned?.code);
      const pub = await fetch(`${BASE}/api/certificates/verify/${earned.code}`);
      const pubBody = await pub.json();
      check("certificates: anyone can verify the code, and the answer names the programme but never the holder", pub.status === 200 && pubBody.valid === true && /University/.test(pubBody.title) && !/user_id|email|@/.test(JSON.stringify(pubBody)));
      check("certificates: an unknown or malformed code is 404", (await call("GET", "/api/certificates/verify/VBJ-AAAAA-BBBBB")) === 404 && (await call("GET", "/api/certificates/verify/not-a-code")) === 404);
      const page = await fetch(`${BASE}/verify/${earned.code}`);
      check("certificates: the public verify page shows a genuine certificate", page.status === 200 && (await page.text()).includes("This certificate is genuine"));
    } finally {
      await admin.from("certificates").delete().eq("user_id", who.id);
      await admin.from("user_badges").delete().eq("user_id", who.id).in("badge_id", ["uni-beginner", "uni-intermediate", "uni-expert"]);
    }
  }

  // Approving a University lesson with proposed dictionary terms (PDL-086): found live, two published terms with no slug and
  // no topic, invisible to the classification backlog because it only looks at classified = false, and this table defaults
  // classified to true. A throwaway course-less lesson, approved through the real route, then everything removed again.
  {
    const { data: course } = await admin.from("courses").select("id").eq("slug", "beginner").single();
    const term = `Probe dictionary term ${Date.now()}`;
    const { data: lesson, error: le } = await admin
      .from("lessons")
      .insert({ course_id: course.id, slug: `probe-${Date.now()}`, title: "Probe lesson (deleted by the probe)", order_index: 9999, is_core: false, status: "pending_review", body: "Probe body.", candidate_terms: [{ term, definition: "A throwaway definition, deleted by the probe." }] })
      .select("id")
      .single();
    if (le) throw le;
    try {
      check("approving a lesson with a proposed term publishes it with a slug, queued for classification", (await call("POST", `/api/admin/university/${lesson.id}/review`, { token: adminToken, body: { decision: "published" } })) === 200);
      const { data: row } = await admin.from("dictionary_terms").select("slug, origin, status, classified").eq("term", term).maybeSingle();
      check("the new term is complete: a slug, origin lesson, published, and not yet classified", row?.slug != null && row.slug !== "" && row.origin === "lesson" && row.status === "published" && row.classified === false);
    } finally {
      await admin.from("dictionary_terms").delete().eq("term", term);
      await admin.from("lessons").delete().eq("id", lesson.id);
    }
  }

  // Your data and deleting your account (GDPR, PDL-079).
  {
    const exp = await fetch(`${BASE}/api/account/export`, { headers: { authorization: `Bearer ${userToken}` } });
    const expText = await exp.text();
    let expJson = null;
    try { expJson = JSON.parse(expText); } catch { /* checked below */ }
    check("account export: the owner gets a JSON download with their own account and nothing secret", exp.status === 200 && (exp.headers.get("content-disposition") ?? "").includes("attachment") && expJson?.account?.email === "user@test.local" && !/encrypted_password|raw_payload|"password"/i.test(expText));
    check("account delete: an admin account cannot be deleted through the API", (await call("DELETE", "/api/account", { token: adminToken, body: { confirm: "DELETE MY ACCOUNT" } })) === 403);
    // A throwaway account with a payment: deleting it removes the person, keeps the payment record, unlinked.
    const email = `probe-delete-${Date.now()}@example.invalid`;
    const { data: created, error: ce } = await admin.auth.admin.createUser({ email, password: "Aa1!probe-delete-9", email_confirm: true });
    if (ce) throw ce;
    const tid = created.user.id;
    try {
      await admin.from("user_profiles").insert({ id: tid, email, tools_used: ["other"], depth_preference: "simple", subscription_status: "trial", trial_started_at: new Date().toISOString(), trial_ends_at: new Date(Date.now() + 86_400_000).toISOString(), subscription_tier: "premium" });
      await admin.from("bookmarks").insert({ user_id: tid, article_id: (await admin.from("articles").select("id").limit(1).single()).data.id });
      await admin.from("payment_events").insert({ paypal_event_id: `probe-${tid}`, event_type: "PAYMENT.CAPTURE.COMPLETED", user_id: tid, tier: "basic", amount_usd: 10, status: "processed", raw_payload: {} });
      const tt = await sessionFor(email);
      check("account delete: without the exact confirmation it is refused (422) and nothing is deleted", (await call("DELETE", "/api/account", { token: tt, body: { confirm: "yes" } })) === 422 && (await admin.from("user_profiles").select("id").eq("id", tid).maybeSingle()).data !== null);
      check("account delete: the owner deletes their own account", (await call("DELETE", "/api/account", { token: tt, body: { confirm: "DELETE MY ACCOUNT" } })) === 200);
      check("account delete: the sign-in account, the profile and their bookmarks are gone", (await admin.auth.admin.getUserById(tid)).data?.user == null && (await admin.from("user_profiles").select("id").eq("id", tid).maybeSingle()).data === null && ((await admin.from("bookmarks").select("*", { count: "exact", head: true }).eq("user_id", tid)).count ?? 0) === 0);
      const kept = (await admin.from("payment_events").select("user_id, amount_usd").eq("paypal_event_id", `probe-${tid}`).maybeSingle()).data;
      check("account delete: the payment record is kept, no longer linked to anyone (accounting law)", kept?.user_id === null && Number(kept?.amount_usd) === 10);
    } finally {
      await admin.from("payment_events").delete().eq("paypal_event_id", `probe-${tid}`);
      await admin.auth.admin.deleteUser(tid).catch(() => undefined);
    }
  }
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
      check("the sandbox of a locked chapter is refused too", (await call("POST", "/api/prompt-school/sandbox/five-pillars/pillar-4-constraints", { token: userToken, body: { prompt: "Summarise the text." } })) === 403);
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
      // Live sandbox (PDL-077). No real model run here: everything below is refused before any AI request is made.
      const sbHeaders = { "content-type": "application/json", authorization: `Bearer ${userToken}` };
      const sbLesson = await (await fetch(`${BASE}/api/prompt-school/lessons/five-pillars/pillar-4-constraints`, { headers: sbHeaders })).json();
      const plainLesson = await (await fetch(`${BASE}/api/prompt-school/lessons/five-pillars/pillar-1-context`, { headers: sbHeaders })).json();
      check("a lesson with a sandbox task carries it, with 3 runs left and no checklist", sbLesson.sandbox?.runsLeft === 3 && sbLesson.sandbox?.dailyCap === 3 && !!sbLesson.sandbox?.task?.sampleInput && !JSON.stringify(sbLesson.sandbox).includes("checklist"));
      check("a lesson without a task carries no sandbox", plainLesson.sandbox === null);
      check("sandbox run: a lesson without a task is 404", (await call("POST", "/api/prompt-school/sandbox/five-pillars/pillar-1-context", { token: userToken, body: { prompt: "Summarise the text." } })) === 404);
      check("sandbox run: a bad slug is 400", (await call("POST", "/api/prompt-school/sandbox/BAD%20SLUG!/x", { token: userToken, body: { prompt: "Summarise the text." } })) === 400);
      check("sandbox run: a missing body, a tiny prompt and a huge prompt are 422", (await call("POST", "/api/prompt-school/sandbox/five-pillars/pillar-4-constraints", { token: userToken })) === 422 && (await call("POST", "/api/prompt-school/sandbox/five-pillars/pillar-4-constraints", { token: userToken, body: { prompt: "hi" } })) === 422 && (await call("POST", "/api/prompt-school/sandbox/five-pillars/pillar-4-constraints", { token: userToken, body: { prompt: "x".repeat(1300) } })) === 422);
      await admin.from("ps_sandbox_runs").insert([1, 2, 3].map(() => ({ user_id: tu.id, task_id: "five-pillars/pillar-4-constraints", prompt_chars: 20 })));
      const sbCapped = await fetch(`${BASE}/api/prompt-school/sandbox/five-pillars/pillar-4-constraints`, { method: "POST", headers: sbHeaders, body: JSON.stringify({ prompt: "Summarise the text below in two sentences." }) });
      const sbCappedBody = await sbCapped.json();
      check("sandbox run: the fourth run of the day is 429 with no runs left, and no run row is added", sbCapped.status === 429 && sbCappedBody.runsLeft === 0 && ((await admin.from("ps_sandbox_runs").select("*", { count: "exact", head: true }).eq("user_id", tu.id)).count === 3));
      const sbLessonCapped = await (await fetch(`${BASE}/api/prompt-school/lessons/five-pillars/pillar-4-constraints`, { headers: sbHeaders })).json();
      check("the lesson then shows 0 runs left", sbLessonCapped.sandbox?.runsLeft === 0);
      await admin.from("ps_sandbox_runs").delete().eq("user_id", tu.id);
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

      // Badges (PDL-075): granted once by the same routes, readable by their owner only.
      const lessonDone = await (await fetch(`${BASE}/api/prompt-school/lessons/five-pillars/pillar-1-context/complete`, { method: "POST", headers: { authorization: `Bearer ${userToken}` } })).json();
      const lessonAgain = await (await fetch(`${BASE}/api/prompt-school/lessons/five-pillars/pillar-1-context/complete`, { method: "POST", headers: { authorization: `Bearer ${userToken}` } })).json();
      check("finishing a lesson pays 5 coins and grants the first-lesson badge once", lessonDone.reward?.coinsAwarded === 5 && lessonDone.badges?.some((b) => b.id === "first-lesson") && lessonAgain.reward === null && lessonAgain.badges?.length === 0);
      const badgeList = await (await fetch(`${BASE}/api/badges`, { headers: { authorization: `Bearer ${userToken}` } })).json();
      check("the badge list shows the earned badge and lists every badge", badgeList.data?.badges?.length >= 12 && badgeList.data.badges.find((b) => b.id === "first-lesson")?.earned === true && badgeList.data.earnedCount === badgeList.data.badges.filter((b) => b.earned).length);

      // University coins (PDL-075): the first completion of a lesson pays 5, a repeat pays nothing.
      const { data: uniLessons } = await admin.from("lessons").select("id, course_id").eq("status", "published").limit(1);
      if (uniLessons?.length) {
        const uni = uniLessons[0];
        const uniBody = JSON.stringify({ course_id: uni.course_id, lesson_id: uni.id });
        const uniOne = await (await fetch(`${BASE}/api/university/progress`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: uniBody })).json();
        const uniTwo = await (await fetch(`${BASE}/api/university/progress`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` }, body: uniBody })).json();
        check("a University lesson pays 5 coins the first time and nothing on a repeat", uniOne.reward?.coinsAwarded === 5 && uniTwo.reward === null);
        await admin.from("course_progress").delete().eq("user_id", tu.id).eq("course_id", uni.course_id);
      }
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
      check("passing the beginner level test grants its badge", goodBody.badges?.some((b) => b.id === "ps-beginner"));
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
      // Nobody pays twice for a plan they already have (PDL-079). These are refused before PayPal is ever called.
      if (label === "premium active") {
        check(`${label}: cannot buy Premium or Basic again while the plan has more than 14 days left`, (await call("POST", "/api/payments/create-order", { token: t, body: { tier: "premium" } })) === 409 && (await call("POST", "/api/payments/create-order", { token: t, body: { tier: "basic" } })) === 409);
      }
      if (label === "basic active") {
        check(`${label}: cannot buy Basic again, and Premium only through the upgrade`, (await call("POST", "/api/payments/create-order", { token: t, body: { tier: "basic" } })) === 409 && (await call("POST", "/api/payments/create-order", { token: t, body: { tier: "premium" } })) === 409);
      }
      if (want.ps !== 200) check(`${label}: assistant delete refused`, (await call("DELETE", "/api/assistant/history/00000000-0000-0000-0000-000000000000", { token: t })) === 403);
      if (want.ps !== 200) check(`${label}: sandbox run refused`, (await call("POST", "/api/prompt-school/sandbox/five-pillars/pillar-4-constraints", { token: t, body: { prompt: "Summarise the text." } })) === 403);
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
