/**
 * Grants badges from the server routes that record progress (PDL-075). Like the coins, a failing grant must never
 * break the learning action, so errors are logged and swallowed; the caller gets only the badges that are NEW, in the
 * shape the browser needs to celebrate them.
 */
import { badgeById, type Badge } from "./domain";
import { grantBadges } from "./repository";

export async function grantNewBadges(userId: string, badgeIds: Array<string | null | undefined>): Promise<Badge[]> {
  const ids = badgeIds.filter((id): id is string => typeof id === "string" && Boolean(badgeById(id)));
  if (ids.length === 0) return [];
  try {
    const fresh = await grantBadges(userId, ids);
    return fresh.map((id) => badgeById(id)).filter((b): b is Badge => Boolean(b));
  } catch (err) {
    console.error(`[BADGES] Grant failed: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}
