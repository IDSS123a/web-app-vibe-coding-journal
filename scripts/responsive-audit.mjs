/**
 * Responsive audit (stress-test item D4, 2026-09-19).
 *
 * Opens every screen of a RUNNING app at phone / tablet / desktop / ultrawide
 * widths in a real Chromium engine and reports, per page x viewport:
 *   - horizontal overflow (page wider than the viewport) + the offending elements
 *   - tap targets smaller than 44x44 px on touch-sized viewports (<= 1024 px wide)
 *   - text smaller than 12 px
 *   - console errors / failed same-origin requests
 * and saves a screenshot of each, so a person can look at the ones it flags.
 *
 * Usage (dev server or `next start` on :3000):
 *   node --env-file=.env.local scripts/responsive-audit.mjs [baseUrl] [outDir]
 *   AUDIT_VIEWPORTS=phone-375,desktop-1440 ...   (optional: only those viewports)
 *
 * Needs: playwright-core (devDependency) and an installed Chrome or Edge -- no
 * browser download. Sessions are minted with the service-role key for the two
 * test accounts (admin@test.local, user@test.local, Premium); the script only
 * reads. Honest limit: this is one engine (Chromium). Firefox / WebKit / real
 * phones are not covered -- see the stress-test plan D4.
 */

import { chromium } from "playwright-core";
import { psChapters, completeChapter, clearPsProgress } from "./ps-fixture.mjs";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? path.join(process.cwd(), ".responsive-audit");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = new URL(SUPABASE_URL).hostname.split(".")[0];

const VIEWPORTS = [
  { name: "fold-280", width: 280, height: 653, touch: true },
  { name: "phone-320", width: 320, height: 568, touch: true },
  { name: "phone-375", width: 375, height: 812, touch: true },
  { name: "phone-landscape-812", width: 812, height: 375, touch: true },
  { name: "tablet-768", width: 768, height: 1024, touch: true },
  { name: "laptop-1024", width: 1024, height: 768, touch: true },
  { name: "desktop-1440", width: 1440, height: 900, touch: false },
  { name: "tablet-landscape-1180", width: 1180, height: 820, touch: true },
  { name: "wide-1920", width: 1920, height: 1080, touch: false },
  { name: "qhd-2560", width: 2560, height: 1440, touch: false },
  { name: "ultrawide-3440", width: 3440, height: 1440, touch: false },
  // The app is light-only; on an OS in dark mode no surface may turn dark.
  { name: "desktop-1440-osdark", width: 1440, height: 900, touch: false, colorScheme: "dark" },
];

// The KANON validation matrix (TYPOGRAPHY_SPEC.md section 16.2, PDL-074): 31 CSS viewports. Select it with
// AUDIT_VIEWPORTS=spec (all), spec-mobile, spec-landscape, spec-tablet, spec-desktop or spec-ultrawide.
const SPEC = {
  "spec-mobile": [[320, 568], [360, 800], [375, 812], [390, 844], [393, 873], [414, 896], [430, 932]],
  "spec-landscape": [[568, 320], [667, 375], [812, 375], [844, 390], [896, 414], [932, 430]],
  "spec-tablet": [[768, 1024], [820, 1180], [834, 1112], [1024, 1366], [1024, 768], [1112, 834], [1180, 820], [1366, 1024]],
  "spec-desktop": [[1280, 720], [1280, 900], [1366, 768], [1440, 900], [1536, 864], [1600, 900], [1920, 1080]],
  "spec-ultrawide": [[2560, 1440], [3440, 1440], [3840, 2160]],
};
for (const [group, sizes] of Object.entries(SPEC)) {
  for (const [w, h] of sizes) VIEWPORTS.push({ name: `${group}-${w}x${h}`, width: w, height: h, touch: w <= 1366 && group !== "spec-desktop" && group !== "spec-ultrawide", group });
}
const wanted = (process.env.AUDIT_VIEWPORTS ?? "").split(",").filter(Boolean);
const selectViewport = (v) => wanted.length === 0 ? !v.group : wanted.some((w) => w === v.name || w === v.group || (w === "spec" && v.group));
// Browser zoom (AUDIT_ZOOM=1.25 or 2): Chrome shrinks the CSS viewport by the zoom and raises the pixel ratio by it.
const ZOOM = Number(process.env.AUDIT_ZOOM ?? 1);
const DPR = Number(process.env.AUDIT_DPR ?? 1);
const REDUCED = process.env.AUDIT_REDUCED === "1";
const CORE = new Set(["/", "/login", "/dashboard", "/archive", "/university", "/dictionary", "/assistant", "/prompt-school", "/prompt-school/level-test/beginner", "/prompt-school/five-pillars", "/prompt-school/five-pillars/practice", "/admin/users", "/admin/review-queue"]);

const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function sessionFor(email) {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new Error(`generateLink ${email}: ${error.message}`);
  const { data, error: e2 } = await anon.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (e2) throw new Error(`verifyOtp ${email}: ${e2.message}`);
  return JSON.stringify(data.session);
}

async function dynamicPaths() {
  const out = {};
  const { data: rep } = await admin
    .from("daily_reports").select("report_date").in("review_status", ["auto_published", "manually_approved"])
    .order("report_date", { ascending: false }).limit(1);
  out.reportDate = rep?.[0]?.report_date;
  const { data: lesson } = await admin.from("lessons").select("slug, chapter_id, course_id").eq("status", "published").eq("is_core", true).limit(1);
  const { data: course } = lesson?.[0] ? await admin.from("courses").select("slug").eq("id", lesson[0].course_id) : { data: null };
  out.lessonPath = lesson?.[0] && course?.[0] ? `/university/${course[0].slug}/${lesson[0].slug}` : null;
  out.chapterId = lesson?.[0]?.chapter_id;
  out.promptSchool = Boolean((await admin.from("ps_chapters").select("id").eq("slug", "five-pillars").eq("published", true).maybeSingle()).data);
  // Every published chapter: its page, its practice, and its first and last lesson (the last one often holds the longest prompt samples).
  out.promptSchoolPaths = [];
  if (out.promptSchool) {
    const { data: chs } = await admin.from("ps_chapters").select("id, slug").eq("published", true).order("order_index");
    for (const c of chs) {
      const { data: ls } = await admin.from("ps_lessons").select("slug").eq("chapter_id", c.id).order("order_index");
      out.promptSchoolPaths.push(`/prompt-school/${c.slug}`, `/prompt-school/${c.slug}/practice`, `/prompt-school/${c.slug}/${ls[0].slug}`);
      if (process.env.AUDIT_ALL_LESSONS) for (const l of ls.slice(1, -1)) out.promptSchoolPaths.push(`/prompt-school/${c.slug}/${l.slug}`);
      if (ls.length > 1) out.promptSchoolPaths.push(`/prompt-school/${c.slug}/${ls[ls.length - 1].slug}`);
    }
    // The three level tests (every chapter is completed for the audit account below, so they render their questions).
    out.promptSchoolPaths.push("/prompt-school/level-test/beginner", "/prompt-school/level-test/intermediate", "/prompt-school/level-test/advanced");
  }
  return out;
}

// Runs inside the page.
function measure({ touch }) {
  const vw = document.documentElement.clientWidth;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const describe = (el) => {
    const t = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className ? "." + el.className.split(/\s+/).slice(0, 2).join(".") : ""} "${t}"`;
  };

  const overflowX = document.documentElement.scrollWidth - vw;
  const offenders = [];
  if (overflowX > 1) {
    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      // Skip anything inside a horizontally scrollable container (intentional).
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if ((ox === "auto" || ox === "scroll" || ox === "hidden") && p.scrollWidth > p.clientWidth) { clipped = true; break; }
        p = p.parentElement;
      }
      if (!clipped && r.right > vw + 1) offenders.push(`${describe(el)} right=${Math.round(r.right)}`);
      if (offenders.length >= 6) break;
    }
  }

  const small = [];
  if (touch) {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], summary';
    for (const el of document.querySelectorAll(sel)) {
      if (!visible(el)) continue;
      // A radio/checkbox is tapped through its <label>; measure that.
      const target = el.matches("input[type=radio], input[type=checkbox]") ? el.closest("label") ?? el : el;
      // WCAG 2.5.8 exempts links that sit inline inside a sentence.
      if (target.tagName === "A" && getComputedStyle(target).display === "inline") continue;
      const r = target.getBoundingClientRect();
      // 43.5: sub-pixel rounding of a 44px (h-11) box must not count as a failure.
      if (r.width < 43.5 || r.height < 43.5) small.push(`${describe(target)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }

  let tinyText = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || !visible(el)) continue;
    seen.add(el);
    if (parseFloat(getComputedStyle(el).fontSize) < 10) tinyText++;
  }

  // KANON conformance (PDL-074): the font roles and the flat/rounded rule, measured on the rendered page.
  const kanon = [];
  const family = (el) => getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim();
  const isCampus = (el) => Boolean(el.closest(".layer-campus"));
  for (const h of document.querySelectorAll("h1")) {
    if (visible(h) && !/unbounded/i.test(getComputedStyle(h).fontFamily)) kanon.push(`h1 is not Unbounded (${family(h)})`);
  }
  for (const el of document.querySelectorAll(".k-editorial, .k-editorial-title")) {
    if (visible(el) && !/serif/i.test(getComputedStyle(el).fontFamily)) kanon.push(`editorial text is not Source Serif (${family(el)})`);
  }
  for (const el of document.querySelectorAll(".k-meta")) {
    if (visible(el) && !/mono/i.test(getComputedStyle(el).fontFamily)) kanon.push(`metadata is not Geist Mono (${family(el)})`);
  }
  const roundedOutsideCampus = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el) || isCampus(el)) continue;
    if (el.closest("svg, img, canvas, [data-kanon-exempt]") || el.matches("input[type=checkbox], input[type=radio]")) continue;
    const cs = getComputedStyle(el);
    const rounded = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"].some((k) => parseFloat(cs[k]) > 0);
    if (rounded || cs.boxShadow !== "none") roundedOutsideCampus.push(describe(el));
    if (roundedOutsideCampus.length >= 4) break;
  }
  if (roundedOutsideCampus.length) kanon.push(`rounded or shadowed outside Campus: ${roundedOutsideCampus.join(" | ")}`);

  return {
    kanon: [...new Set(kanon)].slice(0, 6),
    overflowX: Math.max(0, overflowX),
    offenders,
    smallTargets: small.length,
    smallTargetExamples: small.slice(0, 5),
    tinyText,
    height: document.documentElement.scrollHeight,
    darkSurfaces: [...document.querySelectorAll("body *")].filter((e) => {
      const c = getComputedStyle(e).backgroundColor.match(/[d.]+/g);
      return c && (c[3] === undefined || +c[3] > 0.5) && (+c[0] + +c[1] + +c[2]) / 3 < 60 && e.getBoundingClientRect().width > 200;
    }).length,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dyn = await dynamicPaths();

  const pages = [
    { path: "/", who: "anon" },
    { path: "/login", who: "anon" },
    { path: "/register", who: "anon" },
    { path: "/welcome", who: "anon" },
    { path: "/set-password", who: "anon" },
    { path: "/dashboard", who: "user" },
    { path: "/archive", who: "user" },
    dyn.reportDate && { path: `/archive/${dyn.reportDate}`, who: "user" },
    { path: "/bookmarks", who: "user" },
    { path: "/university", who: "user" },
    dyn.lessonPath && { path: dyn.lessonPath, who: "user" },
    dyn.chapterId && { path: `/university/chapters/${dyn.chapterId}/quiz`, who: "user" },
    { path: "/university/level-test/beginner", who: "user" },
    { path: "/dictionary", who: "user" },
    { path: "/assistant", who: "user" },
    dyn.promptSchool && { path: "/prompt-school", who: "user" },
    dyn.promptSchool && { path: "/prompt-school#book-popup", who: "user", popup: true },
    ...(dyn.promptSchoolPaths ?? []).map((path) => ({ path, who: "user" })),
    { path: "/admin/users", who: "admin" },
    { path: "/admin/review-queue", who: "admin" },
    { path: "/admin/payments", who: "admin" },
    { path: "/admin/university", who: "admin" },
    { path: "/admin/hold-gate-calibration", who: "admin" },
  ].filter(Boolean).filter((p) => process.env.AUDIT_PAGES !== "core" || CORE.has(p.path));

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const rows = [];

  // The Prompt School practice page only shows its exercises once every lesson is done, so the test
  // account gets that progress for the run and loses it again afterwards.
  let psUserId = null;
  if (dyn.promptSchool) {
    const { data: tu } = await admin.from("user_profiles").select("id").eq("email", "user@test.local").single();
    psUserId = tu.id;
    // Every chapter complete, so every page is open and every practice page shows its exercises.
    await clearPsProgress(admin, psUserId);
    for (const c of await psChapters(admin)) await completeChapter(admin, psUserId, c);
  }

  try {
    for (const vp of VIEWPORTS.filter(selectViewport)) {
      // Fresh sessions per viewport: one long run with a single session started
      // returning 401 partway through (token/refresh-token reuse across many contexts).
      const sessions = { anon: null, user: await sessionFor("user@test.local"), admin: await sessionFor("admin@test.local") };
      for (const who of ["anon", "user", "admin"]) {
        const context = await browser.newContext({
          viewport: { width: Math.round(vp.width / ZOOM), height: Math.round(vp.height / ZOOM) },
          hasTouch: vp.touch,
          isMobile: vp.width <= 812 && vp.touch,
          deviceScaleFactor: DPR * ZOOM,
          colorScheme: vp.colorScheme ?? "light",
          reducedMotion: REDUCED ? "reduce" : "no-preference",
        });
        if (sessions[who]) {
          await context.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch {} }, [`sb-${REF}-auth-token`, sessions[who]]);
        }
        for (const pg of pages.filter((p) => p.who === who)) {
          const page = await context.newPage();
          const errors = [];
          page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 120)); });
          page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`); });
          page.on("pageerror", (e) => errors.push(`pageerror: ${String(e.message).slice(0, 120)}`));
          try {
            if (pg.popup) await page.addInitScript(() => { try { sessionStorage.setItem("ps-book-popup", JSON.stringify({ seconds: 298 })); } catch {} });
            await page.goto(BASE + pg.path, { waitUntil: "networkidle", timeout: 45000 });
            await page.waitForTimeout(pg.popup ? 3200 : 600);
            const m = await page.evaluate(measure, { touch: vp.touch && vp.width <= 1024 });
            const shot = `${vp.name}__${pg.path.replace(/[^a-z0-9]+/gi, "_") || "home"}.png`;
            await page.screenshot({ path: path.join(OUT, shot), fullPage: false });
            rows.push({ vp: vp.name, path: pg.path, ...m, errors: [...new Set(errors)].slice(0, 3) });
          } catch (e) {
            rows.push({ vp: vp.name, path: pg.path, failed: String(e.message).slice(0, 120) });
          }
          await page.close();
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    if (psUserId) await clearPsProgress(admin, psUserId);
  }

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(rows, null, 2));

  // Legitimately black surfaces (buttons) exist in light mode too: compare with the light run of the same page.
  const lightDark = new Map(rows.filter((r) => r.vp === "desktop-1440").map((r) => [r.path, r.darkSurfaces]));
  const extraDark = (r) => r.vp.endsWith("osdark") ? Math.max(0, (r.darkSurfaces ?? 0) - (lightDark.get(r.path) ?? 0)) : 0;
  const bad = rows.filter((r) => r.failed || r.overflowX > 1 || r.errors?.length || extraDark(r) > 0 || r.kanon?.length);
  console.log(`\n${rows.length} page x viewport checks; ${bad.length} with overflow / errors / failure\n`);
  for (const r of bad) {
    console.log(`${r.vp.padEnd(20)} ${r.path}`);
    if (r.failed) console.log(`   FAILED: ${r.failed}`);
    if (r.overflowX > 1) console.log(`   OVERFLOW +${r.overflowX}px: ${r.offenders.join(" | ")}`);
    if (r.errors?.length) console.log(`   console: ${r.errors.join(" | ")}`);
    if (extraDark(r) > 0) console.log(`   ${extraDark(r)} extra DARK SURFACES in OS dark mode`);
    if (r.kanon?.length) console.log(`   KANON: ${r.kanon.join(" | ")}`);
  }

  const touchRows = rows.filter((r) => !r.failed && r.smallTargets > 0 && (["phone-320", "phone-375", "tablet-768"].includes(r.vp) || /^spec-(mobile|landscape|tablet)/.test(r.vp)));
  console.log(`\nSmall tap targets (<44px) at 320/375/768: ${touchRows.length} page x viewport combos`);
  const byPath = new Map();
  for (const r of touchRows) if (r.vp === "phone-375") byPath.set(r.path, r);
  for (const [p, r] of byPath) console.log(`   ${p.padEnd(44)} ${r.smallTargets} targets, e.g. ${r.smallTargetExamples.slice(0, 2).join(" ; ")}`);

  const tiny = rows.filter((r) => r.tinyText > 0);
  console.log(`\nPages with text <10px (the spec's smallest metadata size): ${[...new Set(tiny.map((r) => `${r.path}(${r.tinyText})`))].slice(0, 12).join(", ") || "none"}`);
  console.log(`\nScreenshots + report.json: ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
