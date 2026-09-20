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
import { psChapters, completeChaptersBefore, finishLessons, clearPsProgress, psProgressCount } from "./ps-fixture.mjs";
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

async function visit(ctx, path, expectText, extra, allowStatus = []) {
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror ${String(e.message).slice(0, 100)}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) problems.push(`console ${m.text().slice(0, 100)}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !allowStatus.includes(r.status()) && new URL(r.url()).origin === new URL(BASE).origin && !r.url().includes("/_next/")) problems.push(`${r.status()} ${new URL(r.url()).pathname}`);
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

  // Prompt School: pages, then a real graded attempt, then the test account's progress is removed again.
  {
    const { data: tu } = await admin.from("user_profiles").select("id").eq("email", "user@test.local").single();
    await clearPsProgress(admin, tu.id);
    const chs = await psChapters(admin);
    const fpCh = chs.find((c) => c.slug === "five-pillars");
    await visit(userCtx, "/prompt-school", "The Five Pillars", async (page) => {
      const text = await page.locator("body").innerText();
      ok("a later chapter shows as locked while the first is incomplete", /Locked: complete/i.test(text));
    });
    await visit(userCtx, "/prompt-school/five-pillars", "opens when you complete the previous chapter", undefined, [403]);
    await visit(userCtx, "/prompt-school/craft-of-prompting", "Finish all 4 lessons to open the practice");
    await completeChaptersBefore(admin, tu.id, "five-pillars");
    await visit(userCtx, "/prompt-school/five-pillars", "Finish all 6 lessons to open the practice");
    await visit(userCtx, "/prompt-school/five-pillars/practice", "The practice opens when you have finished every lesson");
    await visit(userCtx, "/prompt-school/five-pillars/pillar-1-context", "Mark lesson as done", async (page) => {
      await page.getByRole("button", { name: /Mark lesson as done/ }).click();
      await page.getByText("Lesson done").first().waitFor({ timeout: 8000 });
      ok("prompt school lesson can be marked done", true);
    });
    // Mark the remaining lessons through the database, as if they had been read, so the practice opens.
    await finishLessons(admin, tu.id, fpCh);
    await visit(userCtx, "/prompt-school/five-pillars", "Start practice");
    await visit(userCtx, "/prompt-school/five-pillars/practice", "Name the pillar", async (page) => {
      const first = page.locator("section").first();
      await first.getByRole("radio", { name: /Context$/ }).click();
      await first.getByRole("button", { name: /Check answer/ }).click();
      await first.getByText(/Passed: 100%/).waitFor({ timeout: 10000 });
      ok("prompt school choice exercise is graded on the server", true);
      const repair = page.locator("section").filter({ hasText: "Repair the prompt with constraints" });
      await repair.locator("textarea").fill("Describe the top 3 benefits of our software for small business owners. Under 200 words. Avoid jargon and keep an encouraging tone.");
      await repair.getByRole("button", { name: /Check answer/ }).click();
      await repair.getByText(/Passed: 100%/).waitFor({ timeout: 10000 });
      ok("prompt school repair exercise is rubric graded", true);
    });

    // Book cross-sell: the cover loads, a click celebrates, pays the one-time bonus and opens PayPal in a new window.
    {
      const { data: before } = await admin.from("user_profiles").select("coin_balance, level").eq("id", tu.id).single();
      await admin.from("reward_events").delete().eq("user_id", tu.id).eq("event_type", "book_discovery");
      const page = await userCtx.newPage();
      try {
        await page.goto(BASE + "/prompt-school", { waitUntil: "networkidle" });
        const cover = page.getByRole("img", { name: /Cover of the book Mastering Prompt Engineering/ });
        await cover.waitFor({ timeout: 15000 });
        ok("book cover image loads", await cover.evaluate((el) => el.complete && el.naturalWidth > 0));
        const [popup] = await Promise.all([
          page.waitForEvent("popup", { timeout: 8000 }),
          page.getByRole("button", { name: /Get the book Mastering/ }).first().click(),
        ]);
        await page.getByText(/You found the book/).first().waitFor({ timeout: 8000 });
        ok("clicking the book celebrates", true);
        await popup.waitForURL(/^https:\/\/www\.paypal\.com\//, { timeout: 15000 });
        ok("the book opens the PayPal page in a new window", popup.url().startsWith("https://www.paypal.com/"), popup.url().slice(0, 60));
        await popup.close();
        const { data: after } = await admin.from("user_profiles").select("coin_balance").eq("id", tu.id).single();
        ok("the first click pays the one-time bonus", after.coin_balance === before.coin_balance + 25, `${before.coin_balance} to ${after.coin_balance}`);
      } finally {
        await page.close();
        await admin.from("reward_events").delete().eq("user_id", tu.id).eq("event_type", "book_discovery");
        await admin.from("user_profiles").update({ coin_balance: before.coin_balance, level: before.level }).eq("id", tu.id);
        const { data: restored } = await admin.from("user_profiles").select("coin_balance, level").eq("id", tu.id).single();
        ok("test account coins restored", restored.coin_balance === before.coin_balance && restored.level === before.level);
      }
    }
    await clearPsProgress(admin, tu.id);
    ok("prompt school test progress removed again", (await psProgressCount(admin, tu.id)) === 0);
  }
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
