/**
 * Top Tools to Try -- pure domain logic (Director-approved, 2026-10-02 six-step
 * feasibility study). Deliberately self-contained (no import from features/dictionary):
 * this project's feature folders don't cross-import each other (A-2), so the small
 * slugify/key-normalisation helpers are duplicated here in their own, Tools-specific
 * form rather than shared.
 */

export type ToolPricing = "free" | "paid";

export function isValidPricing(v: unknown): v is ToolPricing {
  return v === "free" || v === "paid";
}

/** Lower-case, letters/digits only. Used to tell whether a proposed tool is already known. */
export function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "tool";
}

export interface PublicTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  url: string | null;
  pricing: ToolPricing;
  mentionCount: number;
  lastSeenAt: string | null;
  firstSeenAt: string;
}
