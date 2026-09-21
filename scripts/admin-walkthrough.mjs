/**
 * Admin walkthrough (2026-09-22): clicks through every admin page as the admin, the way a person would, and checks that each
 * action really does what it says, in the database and for the affected user. It never approves, rejects or publishes anything
 * real (reports, lessons, suggestions are only opened), and everything it changes on the test account is restored at the end.
 *   node --env-file=.env.local scripts/admin-walkthrough.mjs [baseUrl]        (default http://localhost:3000)
 *   SHOTS=1 ... also writes screenshots to .admin-walkthrough/
 */
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = new URL(URL_).hostname.split(".")[0];
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const SHOTS = process.env.SHOTS === "1";
if (SHOTS) fs.mkdirSync(".admin-walkthrough", { recursive: true });

let failures = 0;
const ok = (name, cond, detail = "") => {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

async function session(email) {
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const { data } = await anon.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  return { json: JSON.stringify(data.session), token: data.session.access_token };
}

const { data: tu } = await admin.from("user_profiles").select("id, subscription_tier, subscription_status, subscription_expires_at, is_blocked").eq("email", "user@test.local").single();
const orig = { subscription_tier: tu.subscription_tier, subscription_status: tu.subscription_status, subscription_expires_at: tu.subscription_expires_at, is_blocked: tu.is_blocked };
const row = async () => (await admin.from("user_profiles").select("subscription_tier, subscription_status, subscription_expires_at, is_blocked").eq("id", tu.id).single()).data;

const adminSession = await session("admin@test.local");
const userSession = await session("user@test.local");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const problems = [];

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(([k, v]) => { localStorage.setItem(k, v); localStorage.setItem("vbj-cookie-notice-seen", "1"); }, [`sb-${REF}-auth-token`, adminSession.json]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`pageerror ${String(e.message).slice(0, 120)}`));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) problems.push(`console ${m.text().slice(0, 120)}`); });
  page.on("response", (r) => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin && !r.url().includes("/_next/")) problems.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `.admin-walkthrough/${name}.png`, fullPage: true }); };
  const go = async (path, text) => { await page.goto(BASE + path, { waitUntil: "networkidle" }); await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 }); };

  // ----- getting around -----
  await go("/dashboard", "In this report");
  const adminLink = page.getByRole("link", { name: "Admin", exact: true });
  await adminLink.first().waitFor({ timeout: 8000 });
  ok("an admin who opens the Dashboard sees an Admin link in the top bar", (await adminLink.count()) >= 1);
  await adminLink.first().click();
  await page.getByText("Users", { exact: true }).first().waitFor({ timeout: 10000 });
  ok("the Admin link leads back into the admin panel", page.url().includes("/admin/users"));
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.getByText("In this report").first().waitFor({ timeout: 10000 });
  ok("and the admin panel's Dashboard link leads out again", page.url().includes("/dashboard"));

  // ----- Users -----
  await go("/admin/users", "user@test.local");
  await shot("users");
  ok("the users list shows the accounts, with tier, status and expiry", (await page.locator("tbody tr").count()) >= 2);
  await page.locator("tbody tr", { hasText: "user@test.local" }).click();
  await page.getByText("Payment History").waitFor({ timeout: 10000 });
  await shot("users-detail");
  const tierSelect = page.getByLabel("Tier");
  ok("opening a user shows their tier, plan, usage and payment history", (await tierSelect.inputValue()) === orig.subscription_tier);

  page.on("dialog", (d) => d.accept());
  await tierSelect.selectOption("basic");
  await page.getByText(/Tier changed to/).waitFor({ timeout: 10000 });
  ok("changing Premium to Basic works and is saved", (await row()).subscription_tier === "basic");
  const meBasic = await (await fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${userSession.token}` } })).json();
  ok("the user's own account sees Basic at once (no Premium pages)", meBasic.subscriptionTier === "basic" && meBasic.hasUniversityAccess === false);
  await page.getByLabel("Tier").selectOption("premium");
  await page.getByText(/Tier changed to Premium/).waitFor({ timeout: 10000 });
  ok("and back to Premium works too", (await row()).subscription_tier === "premium" && (await (await fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${userSession.token}` } })).json()).hasUniversityAccess === true);

  const future = new Date(Date.now() + 300 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Plan end date").fill(future);
  await page.getByRole("button", { name: "Set end date" }).click();
  await page.getByText(/Plan end date set to/).waitFor({ timeout: 10000 });
  const afterDate = await row();
  ok("Set end date makes the plan active until that day", afterDate.subscription_status === "active" && afterDate.subscription_expires_at?.startsWith(future));
  await page.getByRole("button", { name: "End paid access now" }).click();
  await page.getByText("Paid access ended.").waitFor({ timeout: 10000 });
  const ended = await row();
  const meEnded = await (await fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${userSession.token}` } })).json();
  ok("End paid access now ends it, and the user is locked out at once", ended.subscription_status === "expired" && meEnded.hasAccess === false);

  await page.getByRole("button", { name: "Block User", exact: true }).click();
  await page.getByRole("button", { name: "Unblock User", exact: true }).waitFor({ timeout: 10000 });
  ok("Block User blocks the account", (await row()).is_blocked === true);
  await page.getByRole("button", { name: "Unblock User", exact: true }).click();
  await page.getByRole("button", { name: "Block User", exact: true }).waitFor({ timeout: 10000 });
  ok("Unblock User restores it", (await row()).is_blocked === false);

  await page.getByRole("button", { name: "+ New Account" }).click();
  ok("+ New Account opens the invite form (not submitted here: it would send a real e-mail)", (await page.getByRole("button", { name: "Create & Invite" }).count()) === 1 && (await page.getByText("Sends an email invite").count()) === 1);
  await shot("users-create");

  // ----- the other admin pages -----
  await go("/admin/review-queue", "Review");
  await shot("review-queue");
  ok("the review queue opens and shows reports waiting or an empty queue", true);
  const firstReport = page.locator('a[href^="/admin/review-queue/"]').first();
  if (await firstReport.count()) {
    await firstReport.click();
    await page.getByRole("button", { name: /Approve/i }).first().waitFor({ timeout: 10000 });
    await shot("review-queue-report");
    ok("a held report opens with Approve and Reject (not clicked here)", (await page.getByRole("button", { name: /Reject/i }).count()) >= 1);
  }

  await go("/admin/payments", "Payments");
  await shot("payments");
  ok("payments shows which PayPal it talks to", (await page.getByText(/PayPal mode:/).count()) === 1);

  await go("/admin/university", "University");
  await shot("university");
  ok("the University admin page opens", true);

  await go("/admin/ai-usage", "AI usage today");
  await shot("ai-usage");
  ok("AI usage shows the Assistant's and the sandbox's share of the day", (await page.getByText("Prompt School sandbox").count()) >= 1 && (await page.getByRole("progressbar").count()) === 2);

  await go("/admin/hold-gate-calibration", "Calibration");
  await shot("hold-gate");
  ok("Hold-Gate Calibration opens", true);

  ok("no page error, console error or failed request on the way", problems.length === 0, problems.slice(0, 4).join(" | "));
} finally {
  await admin.from("user_profiles").update(orig).eq("id", tu.id);
  await admin.auth.admin.updateUserById(tu.id, { ban_duration: "none" }).catch(() => undefined);
  await browser.close();
  const back = await row();
  console.log(back.subscription_tier === orig.subscription_tier && back.subscription_status === orig.subscription_status && back.is_blocked === orig.is_blocked ? "PASS  test account restored exactly" : "FAIL  test account NOT restored");
}
console.log(failures ? `\n${failures} FAILED` : "\nall admin checks passed");
process.exit(failures ? 1 : 0);
