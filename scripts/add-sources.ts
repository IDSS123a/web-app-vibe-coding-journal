/**
 * Adds the verified feeds of 2026-09-19 to the sources table (PDL-059). Idempotent: a
 * source whose URL already exists is left alone. Every feed below was fetched and parsed
 * on that date, answered HTTP 200 and had items from the last 30 days (Anthropic, Cursor,
 * Windsurf, Netlify and Microsoft AI answered 404/410: no usable feed, listed in the
 * PDL as gaps). Class letters follow features/sources/domain.ts:
 *   A official vendor, C independent technical, E developer reality, F industry press.
 *
 *   npx tsx --env-file=.env.local scripts/add-sources.ts
 */
import { createClient } from "@supabase/supabase-js";

const SOURCES = [
  { name: "GitHub Changelog", url: "https://github.blog/changelog/feed/", source_class: "A", trust_score: 95, topics: ["github", "copilot", "ai-coding"] },
  { name: "Vercel Changelog", url: "https://vercel.com/changelog/rss.xml", source_class: "A", trust_score: 92, topics: ["vercel", "v0", "deployment", "ai-sdk"] },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/rss.xml", source_class: "A", trust_score: 95, topics: ["gemini", "models"] },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", source_class: "A", trust_score: 88, topics: ["models", "open-weights", "agents"] },
  { name: "VS Code Updates", url: "https://code.visualstudio.com/feed.xml", source_class: "A", trust_score: 90, topics: ["vscode", "copilot", "ide"] },
  { name: "JetBrains AI Blog", url: "https://blog.jetbrains.com/ai/feed/", source_class: "A", trust_score: 85, topics: ["jetbrains", "ai-ide"] },
  { name: "Zed Blog", url: "https://zed.dev/blog.rss", source_class: "A", trust_score: 85, topics: ["zed", "ai-ide"] },
  { name: "Replit Blog", url: "https://blog.replit.com/feed.xml", source_class: "A", trust_score: 85, topics: ["replit", "app-builders"] },
  { name: "Supabase Blog", url: "https://supabase.com/rss.xml", source_class: "A", trust_score: 85, topics: ["supabase", "backend"] },
  { name: "Cloudflare Blog", url: "https://blog.cloudflare.com/rss/", source_class: "A", trust_score: 82, topics: ["cloudflare", "agents", "edge"] },
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", source_class: "C", trust_score: 92, topics: ["llm", "ai-coding", "analysis"] },
  { name: "Latent Space", url: "https://www.latent.space/feed", source_class: "C", trust_score: 88, topics: ["ai-engineering", "agents", "news"] },
  { name: "The Pragmatic Engineer", url: "https://blog.pragmaticengineer.com/rss/", source_class: "C", trust_score: 85, topics: ["engineering", "industry"] },
  { name: "Stack Overflow Blog", url: "https://stackoverflow.blog/feed/", source_class: "C", trust_score: 80, topics: ["developers", "ai-coding"] },
  { name: "Import AI", url: "https://importai.substack.com/feed", source_class: "C", trust_score: 80, topics: ["research", "ai"] },
  { name: "Lobsters: vibecoding", url: "https://lobste.rs/t/vibecoding.rss", source_class: "C", trust_score: 84, topics: ["vibe-coding"] },
  { name: "Hacker News: vibe coding", url: "https://hnrss.org/newest?q=%22vibe+coding%22&points=5", source_class: "C", trust_score: 80, topics: ["vibe-coding"] },
  { name: "DEV: vibecoding", url: "https://dev.to/feed/tag/vibecoding", source_class: "E", trust_score: 65, topics: ["vibe-coding", "practice"] },
  { name: "DEV: claudecode", url: "https://dev.to/feed/tag/claudecode", source_class: "E", trust_score: 65, topics: ["claude-code", "practice"] },
  { name: "Ars Technica AI", url: "https://arstechnica.com/ai/feed/", source_class: "F", trust_score: 72, topics: ["ai", "industry"] },
] as const;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const { data: existing, error } = await sb.from("sources").select("url");
  if (error) throw error;
  const have = new Set((existing ?? []).map((s) => s.url as string));
  const fresh = SOURCES.filter((s) => !have.has(s.url));
  console.log(`${SOURCES.length} listed, ${SOURCES.length - fresh.length} already present, adding ${fresh.length}`);
  if (fresh.length === 0) return;
  const { error: insErr } = await sb.from("sources").insert(fresh.map((s) => ({ ...s, type: "rss", enabled: true, topics: [...s.topics] })));
  if (insErr) throw insErr;
  const { count } = await sb.from("sources").select("*", { count: "exact", head: true }).eq("enabled", true);
  console.log(`enabled sources now: ${count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
