/**
 * Integration test — P-3 hype-word filter blocks auto-publish (finding #14).
 *
 * Proves that a Daily Report containing an article whose text has a hype word
 * is held_for_review, NOT auto-published — even when its confidence is high
 * (so the hold is caused by the hype word, not the confidence threshold).
 *
 * Usage:  node scripts/test-hype-hold.mjs [baseUrl]
 *   baseUrl defaults to http://localhost:3000 (pass http://localhost:3005 etc.)
 *
 * Requires the dev server running and .env.local with Supabase + CRON_SECRET.
 * Self-contained: disables sources for the run and restores them afterward.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = process.argv[2] || "http://localhost:3000";

// --- load .env.local ---
const env = {};
for (const line of readFileSync(join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const CRON = env.CRON_SECRET || "dev-secret-change-in-production";
const sbHeaders = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };

let pass = 0, fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) { console.log(`  [PASS] ${name}`); pass++; }
  else { console.log(`  [FAIL] ${name}  ${detail}`); fail++; }
};

async function rest(path, opts = {}) {
  const res = await fetch(`${SB}/rest/v1/${path}`, { headers: sbHeaders, ...opts });
  const text = await res.text();
  return { status: res.status, body: text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null };
}
const clearArticles = () => rest(`articles?id=neq.00000000-0000-0000-0000-000000000000`, { method: "DELETE" });
const insertArticle = (a) => rest(`articles`, { method: "POST", headers: { ...sbHeaders, Prefer: "return=minimal" }, body: JSON.stringify(a) });

async function runCron() {
  const res = await fetch(`${baseUrl}/api/cron/daily-digest`, { method: "POST", headers: { Authorization: `Bearer ${CRON}` } });
  return res.json();
}

function makeArticle(summary, tag) {
  const stamp = Date.now();
  return {
    title: `Synthetic test article ${tag} ${stamp}`,
    url: `https://example.test/${tag}/${stamp}`,
    source: "Synthetic Test",
    published_at: new Date().toISOString(),
    raw_summary: "neutral raw summary",
    summary,
    hash: `test-hype-${tag}-${stamp}`,
    confidence_score: 0.8, // ABOVE 0.6 threshold, so confidence never causes the hold
    duplicate_of: null,
  };
}

async function main() {
  console.log(`\nP-3 hype-word hold test → ${baseUrl}\n`);

  // Save + disable all enabled sources so collection adds nothing (isolation)
  const enabled = (await rest(`sources?select=id&enabled=eq.true`)).body || [];
  const enabledIds = enabled.map((s) => s.id);
  if (enabledIds.length) {
    await rest(`sources?enabled=eq.true`, { method: "PATCH", headers: { ...sbHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ enabled: false }) });
  }
  console.log(`(disabled ${enabledIds.length} source(s) for isolation)\n`);

  try {
    // CASE A: hype word present -> must hold
    console.log("CASE A — article summary contains a hype word ('revolutionary')");
    await clearArticles();
    await insertArticle(makeArticle("This tool is revolutionary and will reshape how you code.", "hype"));
    const a = await runCron();
    check("report is held_for_review", a.phases?.dailyReport?.reviewStatus === "held_for_review", `got ${a.phases?.dailyReport?.reviewStatus}`);
    const reasons = a.phases?.dailyReport?.holdReasons || [];
    check("hold reason cites hype words (P-3)", reasons.some((r) => r.toLowerCase().includes("hype")), `reasons=${JSON.stringify(reasons)}`);
    check("hold NOT caused by confidence", !reasons.some((r) => r.toLowerCase().includes("confidence")), `reasons=${JSON.stringify(reasons)}`);

    // CASE B: no hype word -> must auto-publish (negative control)
    console.log("\nCASE B — clean summary, same high confidence (negative control)");
    await clearArticles();
    await insertArticle(makeArticle("A measured, useful update with concrete steps to try today.", "clean"));
    const b = await runCron();
    check("report is auto_published", b.phases?.dailyReport?.reviewStatus === "auto_published", `got ${b.phases?.dailyReport?.reviewStatus}`);
    check("no hold reasons", (b.phases?.dailyReport?.holdReasons || []).length === 0, `reasons=${JSON.stringify(b.phases?.dailyReport?.holdReasons)}`);
  } finally {
    // Restore sources + clean up test articles
    await clearArticles();
    if (enabledIds.length) {
      for (const id of enabledIds) {
        await rest(`sources?id=eq.${id}`, { method: "PATCH", headers: { ...sbHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ enabled: true }) });
      }
    }
    console.log(`\n(restored ${enabledIds.length} source(s), cleaned test articles)`);
  }

  console.log(`\n=====================================`);
  console.log(` RESULTS: ${pass} passed, ${fail} failed`);
  console.log(`=====================================\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error("test error:", e); process.exit(1); });
