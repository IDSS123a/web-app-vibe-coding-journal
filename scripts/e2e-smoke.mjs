/**
 * End to end smoke test in a real Chrome (stress test 2026-09-19). Walks the main journeys of a
 * Premium reader and an admin against a RUNNING app and fails on: a page that does not show its
 * key content, a console error, a failed same-origin request, or a broken interaction.
 *
 *   node --env-file=.env.local scripts/e2e-smoke.mjs [baseUrl]
 *
 * Uses the two test accounts (user@test.local Premium, admin@test.local). It bookmarks one
 * article and removes that bookmark again; nothing else is written.
 */
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const BASE = process.argv[2] ?? "http://localhost:3000";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = new URL(URL_).hostname.split(".")[0];
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

let failures = 0;
const ok = (name, cond, detail = "") => {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

async function sessionFor(email) {
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const { data } = await anon.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  return JSON.stringify(data.session);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function visit(ctx, path, expectText, extra) {
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror ${String(e.message).slice(0, 100)}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) problems.push(`console ${m.text().slice(0, 100)}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin && !r.url().includes("/_next/")) problems.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
  let found = true;
  try {
    await page.getByText(expectText, { exact: false }).first().waitFor({ timeout: 15000 });
  } catch {
    found = false;
  }
  if (found && extra) await extra(page);
  ok(`${path} shows "${expectText}"`, found && problems.length === 0, problems.join(" | ").slice(0, 200));
  await page.close();
}

try {
  const userCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await userCtx.addInitScript(([k, v]) => localStorage.setItem(k, v), [`sb-${REF}-auth-token`, await sessionFor("user@test.local")]);

  await visit(userCtx, "/dashboard", "In this report");
  await visit(userCtx, "/archive", "Archive");
  const { data: rep } = await admin.from("daily_reports").select("date").in("review_status", ["auto_published", "manually_approved"]).order("date", { ascending: false }).limit(3);
  if (rep?.[2]) await visit(userCtx, `/archive/${rep[2].date}`, "In this report");
  await visit(userCtx, "/bookmarks", "Bookmarks");
  await visit(userCtx, "/university", "University");
  await visit(userCtx, "/dictionary", "Browse by topic", async (page) => {
    await page.fill("#dictionary-search", "context window");
    await page.waitForTimeout(400);
    const first = await page.locator("article h3").first().innerText();
    ok("dictionary search finds Context window first", /context window/i.test(first), first);
  });
  await visit(userCtx, "/assistant", "Generate My Prompt");
  await visit(userCtx, "/welcome", "Dashboard");

  // Bookmark round trip on the dashboard
  {
    const page = await userCtx.newPage();
    await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
    const btn = page.getByRole("button", { name: /Bookmark$/ }).first();
    await btn.waitFor({ timeout: 15000 });
    await btn.click();
    await page.getByRole("button", { name: /Bookmarked/ }).first().waitFor({ timeout: 8000 });
    ok("bookmark toggles on", true);
    await page.getByRole("button", { name: /Bookmarked/ }).first().click();
    await page.getByRole("button", { name: /^☆ Bookmark$/ }).first().waitFor({ timeout: 8000 });
    ok("bookmark toggles off again", true);
    await page.close();
  }

  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await adminCtx.addInitScript(([k, v]) => localStorage.setItem(k, v), [`sb-${REF}-auth-token`, await sessionFor("admin@test.local")]);
  await visit(adminCtx, "/admin/users", "Users");
  await visit(adminCtx, "/admin/review-queue", "Review");
  await visit(adminCtx, "/admin/payments", "Payment");
  await visit(adminCtx, "/admin/university", "University");

  // A signed-in ordinary user must not see admin content
  {
    const page = await userCtx.newPage();
    await page.goto(BASE + "/admin/users", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const text = await page.locator("body").innerText();
    ok("ordinary user sees no admin user list", !/BLOCKED|New account/i.test(text) || /not authorized/i.test(text));
    await page.close();
  }

  // Signed-out visitor
  const anonCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await visit(anonCtx, "/", "Enter the Journal");
  await visit(anonCtx, "/login", "Sign In");
  await visit(anonCtx, "/register", "Register");
  {
    const page = await anonCtx.newPage();
    await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const text = await page.locator("body").innerText();
    ok("signed-out visitor sees no report on /dashboard", !/In this report/.test(text));
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} FAILED` : "\nall smoke checks passed");
process.exit(failures ? 1 : 0);
