/**
 * The "no AI tells" writing rule (Director, 2026-09-19): recognisable marks of
 * machine-written prose, above all the spaced em dash ("...you — filters the
 * noise..."), must never appear anywhere a reader can see. The em dash becomes a
 * comma and a space. A range such as 2025–2026 keeps its meaning with a hyphen.
 *
 * Where it runs (all three, because each alone leaves a hole):
 *   1. AI output boundary: every parsed Gemini response is passed through
 *      stripAiTellsDeep before any caller sees it (lib/ai/gemini-provider.ts).
 *   2. Storage: content written from other sources (imports, feeds) is passed
 *      through stripAiTells before insert.
 *   3. Source: a test (lib/text/no-ai-tells.guard.test.ts) fails the build if an
 *      em dash is added to user-facing source.
 *
 * Code is left alone: fenced blocks and inline `code` may legitimately contain
 * " -- " (a CLI separator) and must keep working when copied.
 */

const DASH = /\s*[—–]\s*/;

/** Transform one prose segment (no code inside it). */
function stripProse(prose: string): string {
  let s = prose;

  // A dash used as a "no value" placeholder ("Confidence: —") becomes n/a.
  s = s.replace(/(:\**[ \t]+)[—–](?=[ \t]*(?:$|\|))/gm, "$1n/a");

  // Ranges of numbers, years and versions: keep the meaning, drop the tell.
  s = s.replace(/(\d)\s*[–—]\s*(\d)/g, "$1-$2");

  // A dash that closes a line which continues on the next one becomes a comma
  // (wrapped prose, "levels —\n a running record"); at the very end it is removed.
  s = s.replace(/[ \t]*[—–][ \t]*(?=\n[ \t]*\S)/g, ",");
  // A dash that opens a line ("— item") is just removed.
  s = s.replace(/^[ \t]*[—–][ \t]*/gm, "");
  s = s.replace(/[ \t]*[—–][ \t]*$/gm, "");

  // A dash next to punctuation that already separates: drop the dash only.
  s = s.replace(/[ \t]*[—–][ \t]*(?=[,.;:!?)\]])/g, "");
  s = s.replace(/(?<=[,;:])[ \t]*[—–][ \t]*/g, " ");

  // The general case: em or en dash, spaced or not, becomes a comma and a space.
  s = s.replace(new RegExp(DASH.source, "g"), ", ");

  // " -- " typed as an em dash by hand or by a model.
  s = s.replace(/(\S)[ \t]+--[ \t]+(\S)/g, "$1, $2");

  // Tidy any double comma or space this produced.
  // Only collapse runs of spaces inside a line, never a line's indentation.
  s = s.replace(/,[ \t]*,/g, ",").replace(/(\S)[ \t]{2,}(?=\S)/g, "$1 ");
  return s;
}

export function stripAiTells(text: string): string {
  if (!text) return text;
  if (!/[—–]| -- /.test(text)) return text;

  // Split on fenced code blocks and inline code; only even-indexed parts are prose.
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return parts.map((part, i) => (i % 2 === 1 ? part : stripProse(part))).join("");
}

/** Applies stripAiTells to every string inside an arbitrary JSON-like value. */
export function stripAiTellsDeep<T>(value: T): T {
  if (typeof value === "string") return stripAiTells(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => stripAiTellsDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = stripAiTellsDeep(v);
    return out as T;
  }
  return value;
}

/** True when the text still contains a mark this module exists to remove. */
export function hasAiTells(text: string): boolean {
  return stripAiTells(text) !== text;
}

/** The instruction added to every prompt so the model does not produce the tell in the first place. */
export const NO_AI_TELLS_PROMPT_RULE =
  'WRITING RULE (mandatory): never use the em dash character or the en dash character as punctuation. ' +
  'Where a dash would go, use a comma and a space, or start a new sentence. Write plain, direct prose.';
