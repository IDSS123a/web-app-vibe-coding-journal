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
  check("bookmark with a non-uuid id is rejected", [400, 404, 422].includes(await call("POST", "/api/bookmarks", { token: userToken, body: { article_id: "nope" } })));

  // 7. Tier matrix, walked by changing the test account and restoring it
  const { data: orig } = await admin.from("user_profiles").select("subscription_tier, subscription_status, trial_ends_at, subscription_expires_at, is_blocked").eq("email", "user@test.local").single();
  const soon = (d) => new Date(Date.now() + d * 864e5).toISOString();
  const cases = [
    ["premium active", { subscription_tier: "premium", subscription_status: "active", subscription_expires_at: soon(200), is_blocked: false }, { dict: 200, reports: 200, assistantGen: "not403" }],
    ["basic active", { subscription_tier: "basic", subscription_status: "active", subscription_expires_at: soon(200), is_blocked: false }, { dict: 403, reports: 200, assistantGen: 403 }],
    ["trial running", { subscription_tier: "basic", subscription_status: "trial", trial_ends_at: soon(2), is_blocked: false }, { dict: 403, reports: 200, assistantGen: 403 }],
    ["trial ended", { subscription_tier: "basic", subscription_status: "trial", trial_ends_at: soon(-1), is_blocked: false }, { dict: 403, reports: 403, assistantGen: 403 }],
    ["expired", { subscription_tier: "premium", subscription_status: "expired", is_blocked: false }, { dict: 403, reports: 403, assistantGen: 403 }],
    ["blocked premium", { subscription_tier: "premium", subscription_status: "active", subscription_expires_at: soon(200), is_blocked: true }, { dict: 403, reports: 403, assistantGen: 403 }],
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
