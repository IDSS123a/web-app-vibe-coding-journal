/**
 * Applies one SQL migration file to the production Supabase project through the
 * Management API (memory: vibe_coding_journal_supabase_migrations_direct).
 *   node --env-file=.env.local scripts/apply-migration.mjs supabase/migrations/023_x.sql
 */
import fs from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("usage: apply-migration.mjs <file.sql>");
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "content-type": "application/json" },
  body: JSON.stringify({ query: fs.readFileSync(file, "utf8") }),
});
const text = await res.text();
console.log(res.status, text.slice(0, 500));
if (!res.ok) process.exit(1);
