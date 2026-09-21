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
import { psChapters, completeChapter, completeChaptersBefore, finishLessons, clearPsProgress, psProgressCount } from "./ps-fixture.mjs";
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
  const [vw, vh0] = (process.env.SMOKE_VIEWPORT ?? "1280x900").split("x").map(Number);
  const userCtx = await browser.newContext({ viewport: { width: vw, height: vh0 } });
  await userCtx.addInitScript(([k, v]) => localStorage.setItem(k, v), [`sb-${REF}-auth-token`, await sessionFor("user@test.local")]);

  await visit(userCtx, "/dashboard", "In this report");
  await visit(userCtx, "/archive", "Archive");
  const { data: rep } = await admin.from("daily_reports").select("date").in("review_status", ["auto_published", "manually_approved"]).order("date", { ascending: false }).limit(3);
  if (rep?.[2]) await visit(userCtx, `/archive/${rep[2].date}`, "In this report");
  await visit(userCtx, "/bookmarks", "Bookmarks");
  await visit(userCtx, "/university", "Στοά", async (page) => {
    ok("University heading carries its Greek name", /Vibe-Coding University - Στοά/i.test(await page.locator("h1").first().innerText()));
  });
  await visit(userCtx, "/dictionary", "Browse by topic", async (page) => {
    await page.fill("#dictionary-search", "context window");
    await page.waitForTimeout(400);
    const first = await page.locator("article h3").first().innerText();
    ok("dictionary search finds Context window first", /context window/i.test(first), first);
  });
  await visit(userCtx, "/assistant", "Generate My Prompt");
  // Assistant history delete (2026-09-21): two clicks, and the item leaves the list. A temporary item is used, no AI run.
  {
    const { data: owner } = await admin.from("user_profiles").select("id").eq("email", "user@test.local").single();
    const { data: made } = await admin.from("prompt_blueprint_generations").insert({ user_id: owner.id, wizard_answers: {}, domain: "smoke-domain", scenario: "s", goal: "smoke goal to delete", explanation: "e", prompt_blueprint: "p", mermaid_diagram: "m", next_steps: "n" }).select("id").single();
    try {
      await visit(userCtx, "/assistant", "Generate My Prompt", async (page) => {
        await page.getByRole("button", { name: "History", exact: true }).click();
        const item = page.getByText("smoke goal to delete");
        await item.waitFor({ timeout: 10000 });
        await page.getByRole("button", { name: /Delete prompt: smoke-domain/ }).click();
        ok("delete asks for a second click first", (await page.getByRole("button", { name: /Confirm delete/ }).count()) === 1 && (await item.count()) === 1);
        await page.getByRole("button", { name: /Cancel/ }).click();
        ok("cancel keeps the item", (await item.count()) === 1 && (await page.getByRole("button", { name: /Confirm delete/ }).count()) === 0);
        await page.getByRole("button", { name: /Delete prompt: smoke-domain/ }).click();
        await page.getByRole("button", { name: /Confirm delete/ }).click();
        await item.waitFor({ state: "detached", timeout: 10000 });
        ok("confirming removes the item from the history", true);
      });
    } finally {
      await admin.from("prompt_blueprint_generations").delete().eq("id", made.id);
    }
  }

  // Prompt School: pages, then a real graded attempt, then the test account's progress is removed again.
  {
    const { data: tu } = await admin.from("user_profiles").select("id").eq("email", "user@test.local").single();
    await clearPsProgress(admin, tu.id);
    const chs = await psChapters(admin);
    const fpCh = chs.find((c) => c.slug === "five-pillars");
    await visit(userCtx, "/prompt-school", "The Five Pillars", async (page) => {
      const text = await page.locator("body").innerText();
      ok("a later chapter shows as locked while the first is incomplete", /Locked: complete/i.test(text));
      ok("Prompt School heading carries its Greek name", /Prompt School - Ἀγορά/i.test(await page.locator("h1").first().innerText()));
    });
    await visit(userCtx, "/prompt-school/five-pillars", "opens when you complete the previous chapter", undefined, [403]);
    await visit(userCtx, "/prompt-school/craft-of-prompting", "lessons to open the practice");
    await completeChaptersBefore(admin, tu.id, "five-pillars");
    await visit(userCtx, "/prompt-school/five-pillars", "lessons to open the practice");
    await visit(userCtx, "/prompt-school/five-pillars/practice", "The practice opens when you have finished every lesson");
    await visit(userCtx, "/prompt-school/five-pillars/pillar-1-context", "Mark lesson as done", async (page) => {
      await page.getByRole("button", { name: /Mark lesson as done/ }).click();
      await page.getByText("Lesson done").first().waitFor({ timeout: 8000 });
      ok("prompt school lesson can be marked done", true);
    });
    // Live sandbox (PDL-077): one real run on the shared free model. A busy or full AI pool is reported, not counted as a bug.
    await visit(userCtx, "/prompt-school/five-pillars/pillar-4-constraints", "Try it live", async (page) => {
      ok("the sandbox panel shows the task, the sample input and 3 runs left", (await page.getByText("3 of 3 runs left today").count()) === 1 && (await page.getByText("The sample input", { exact: true }).count()) === 1);
      ok("the checklist is not shown before a run", (await page.getByText("Check it yourself").count()) === 0);
      const panel = page.locator("section", { hasText: "Try it live" });
      await page.getByRole("button", { name: /Run my prompt/ }).click();
      const outcome = await Promise.race([
        page.getByText("What the model answered").first().waitFor({ timeout: 60000 }).then(() => "reply"),
        panel.getByRole("alert").first().waitFor({ timeout: 60000 }).then(() => "alert"),
      ]);
      if (outcome === "reply") {
        ok("a real run shows the model's answer", true);
        ok("after a run the self-check list appears", (await page.getByText("Check it yourself").count()) === 1);
        ok("the run used one of the three", (await page.getByText("2 of 3 runs left today").count()) === 1);
      } else {
        const msg = await panel.getByRole("alert").first().innerText();
        const busy = /busy|capacity/i.test(msg);
        ok("a failed run is explained and not counted", busy && (await page.getByText("3 of 3 runs left today").count()) === 1, msg.slice(0, 120));
      }
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
      await first.getByText(/\+5 Vibe Coins/).first().waitFor({ timeout: 5000 });
      ok("passing an exercise shows the coins it paid, in the result", true);
      const box = await first.locator('[role="status"]').first().boundingBox();
      const vh = page.viewportSize()?.height ?? 0;
      ok("the result is in view right after checking", Boolean(box) && box.y >= 0 && box.y < vh, box ? `y=${Math.round(box.y)} of ${vh}` : "no box");
      const repair = page.locator("section").filter({ hasText: "Repair the prompt with constraints" });
      await repair.locator("textarea").fill("Describe the top 3 benefits of our software for small business owners. Under 200 words. Avoid jargon and keep an encouraging tone.");
      await repair.getByRole("button", { name: /Check answer/ }).click();
      await repair.getByText(/Passed: 100%/).waitFor({ timeout: 10000 });
      ok("prompt school repair exercise is rubric graded", true);
    });

    // Book pop-up (Director, 2026-09-20): no fixed block, a modal every 5 minutes of reading, closes by itself after 20 seconds.
    {
      const { data: before } = await admin.from("user_profiles").select("coin_balance, level").eq("id", tu.id).single();
      await admin.from("reward_events").delete().eq("user_id", tu.id).eq("event_type", "book_discovery");
      const nearlyDue = async () => {
        const page = await userCtx.newPage();
        // The clock lives in sessionStorage; start it three seconds before the five minutes are up.
        await page.addInitScript(() => { try { sessionStorage.setItem("ps-book-popup", JSON.stringify({ seconds: 297 })); } catch {} });
        return page;
      };
      try {
        {
          const page = await userCtx.newPage();
          await page.goto(BASE + "/prompt-school", { waitUntil: "networkidle" });
          await page.getByText("The Five Pillars").first().waitFor({ timeout: 15000 });
          ok("the book is not a fixed block on the page", (await page.getByRole("img", { name: /Cover of the book/ }).count()) === 0);
          await page.close();
        }
        {
          const page = await nearlyDue();
          await page.goto(BASE + "/prompt-school", { waitUntil: "networkidle" });
          const dialog = page.getByRole("dialog");
          await dialog.waitFor({ timeout: 12000 });
          ok("the book pop-up opens as a modal after five minutes of reading", await dialog.getByRole("img", { name: /Cover of the book Mastering Prompt Engineering/ }).isVisible());
          ok("its cover image loads", await dialog.getByRole("img").first().evaluate((el) => el.complete && el.naturalWidth > 0));
          await dialog.waitFor({ state: "detached", timeout: 30000 });
          ok("the pop-up closes by itself after 20 seconds", true);
          await page.close();
        }
        {
          const page = await nearlyDue();
          await page.goto(BASE + "/prompt-school", { waitUntil: "networkidle" });
          const dialog = page.getByRole("dialog");
          await dialog.waitFor({ timeout: 12000 });
          await dialog.getByRole("button", { name: "Not now" }).click();
          await dialog.waitFor({ state: "detached", timeout: 3000 });
          ok("Not now closes the pop-up", true);
          await page.waitForTimeout(4500);
          ok("after closing, it does not come straight back (the clock restarted)", (await page.getByRole("dialog").count()) === 0);
          await page.close();
        }
        {
          const page = await nearlyDue();
          await page.goto(BASE + "/prompt-school", { waitUntil: "networkidle" });
          const dialog = page.getByRole("dialog");
          await dialog.waitFor({ timeout: 12000 });
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "detached", timeout: 3000 });
          ok("Escape closes the pop-up", true);
          await page.close();
        }
        {
          const page = await nearlyDue();
          await page.goto(BASE + "/prompt-school", { waitUntil: "networkidle" });
          const dialog = page.getByRole("dialog");
          await dialog.waitFor({ timeout: 12000 });
          const [popup] = await Promise.all([
            page.waitForEvent("popup", { timeout: 8000 }),
            dialog.getByRole("button", { name: /Get the book →/ }).click(),
          ]);
          await page.getByText(/You found the book/).first().waitFor({ timeout: 8000 });
          ok("Get the book celebrates", true);
          await popup.waitForURL(/^https:\/\/www\.paypal\.com\//, { timeout: 15000 });
          ok("Get the book opens the PayPal page in a new window", popup.url().startsWith("https://www.paypal.com/"), popup.url().slice(0, 60));
          await popup.close();
          await dialog.waitFor({ state: "detached", timeout: 5000 });
          ok("the pop-up closes once the payment page has opened", true);
          const { data: after } = await admin.from("user_profiles").select("coin_balance").eq("id", tu.id).single();
          ok("the first click pays the one-time bonus", after.coin_balance === before.coin_balance + 25, `${before.coin_balance} to ${after.coin_balance}`);
          await page.close();
        }
      } finally {
        await admin.from("reward_events").delete().eq("user_id", tu.id).eq("event_type", "book_discovery");
        await admin.from("user_profiles").update({ coin_balance: before.coin_balance, level: before.level }).eq("id", tu.id);
        const { data: restored } = await admin.from("user_profiles").select("coin_balance, level").eq("id", tu.id).single();
        ok("test account coins restored", restored.coin_balance === before.coin_balance && restored.level === before.level);
      }
    }
    // Level test (phase B): locked for another level, open for the beginner level once its chapters are complete,
    // answered in the browser, submitted once and graded on the server.
    {
      const { data: lv } = await admin.from("ps_chapters").select("slug, level").eq("published", true);
      for (const c of chs.filter((x) => lv.find((l) => l.slug === x.slug)?.level === "beginner")) await completeChapter(admin, tu.id, c);
      await visit(userCtx, "/prompt-school/level-test/intermediate", "opens when you complete every chapter of the level", undefined, [403]);
      await visit(userCtx, "/prompt-school", "Start the test", async (page) => {
        ok("the overview shows the beginner level test as open", /start the test/i.test(await page.locator('[data-testid="level-test-beginner"]').innerText()));
      });
      await visit(userCtx, "/prompt-school/level-test/beginner", "answered", async (page) => {
        ok("the level test page is titled with its level", /Beginner level test/i.test(await page.locator("h1").first().innerText()));
        const submit = page.getByRole("button", { name: /Submit the test/ });
        ok("submit is disabled while questions are unanswered", await submit.isDisabled());
        const sections = page.locator("section");
        const n = await sections.count();
        for (let i = 0; i < n; i++) {
          const sec = sections.nth(i);
          if ((await sec.getByRole("radio").count()) > 0) await sec.getByRole("radio").first().click();
          const selects = sec.locator("select");
          for (let k = 0; k < (await selects.count()); k++) await selects.nth(k).selectOption({ index: 1 });
        }
        let enabled = false;
        for (let t = 0; t < 20 && !enabled; t++) {
          enabled = await submit.isEnabled();
          if (!enabled) await page.waitForTimeout(250);
        }
        ok("submit opens once every question is answered", enabled, await page.locator("body").innerText().then((x) => (x.match(/\d+ of \d+ answered/) ?? [""])[0]));
        await submit.click();
        await page.getByText(/(Passed|Not yet): \d+%/).first().waitFor({ timeout: 15000 });
        ok("the level test is graded on the server and shows a score", true);
        ok("no explanation or answer is shown after the test", (await page.getByText("A strong rewrite").count()) === 0 && (await page.getByText(/^Why$/).count()) === 0);
      });
      const { count: attempts } = await admin.from("ps_level_test_attempts").select("*", { count: "exact", head: true }).eq("user_id", tu.id);
      ok("the attempt is recorded", attempts === 1, String(attempts));
    }
    await clearPsProgress(admin, tu.id);
    ok("prompt school test progress removed again", (await psProgressCount(admin, tu.id)) === 0);
  }
  await visit(userCtx, "/badges", "earned", async (page) => {
    ok("the badges page lists the badges", (await page.locator("li").count()) >= 12);
  });
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
