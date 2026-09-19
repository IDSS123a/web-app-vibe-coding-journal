/**
 * Shared shared-secret check for cron-triggered endpoints (daily digest,
 * University generation, subscription-expiry check, hold-gate calibration).
 *
 * Fixed 2026-09-19 (stress test S5): each route used to carry its own copy of
 * `process.env.CRON_SECRET || "dev-secret-change-in-production"`. Production was
 * not exposed (verified: that default is rejected with 401), but the pattern
 * FAILS OPEN: if CRON_SECRET were ever missing from an environment (a new
 * Vercel project, a deleted variable, a preview deploy), every cron endpoint
 * would silently become callable by anyone who read this repository and knew
 * the default. It now fails CLOSED: no configured secret → every request is
 * refused and an error is logged. The comparison is constant-time.
 */

import { timingSafeEqual } from "node:crypto";

export function isValidCronSecret(authorizationHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[CRON] CRON_SECRET is not configured — refusing every cron request (fail closed)");
    return false;
  }
  if (!authorizationHeader) return false;

  const parts = authorizationHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return false;

  const supplied = Buffer.from(parts[1]!);
  const expected = Buffer.from(secret);
  // timingSafeEqual throws on different lengths; a length mismatch is simply "no".
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
