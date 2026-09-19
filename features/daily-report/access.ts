/**
 * Server-side paywall for the paid daily content (Daily Report, Archive,
 * Bookmarks) — Director, 2026-09-19: "if someone has not paid they cannot
 * access; $10 = one level; $50 = the highest level".
 *
 * Why this exists: the session lives in the browser (localStorage), so a
 * server-rendered page cannot know who is asking. /archive had no guard at
 * all and /dashboard was guarded only in the browser — the article text was
 * still in the page source for anyone (proven with curl, 2026-09-19). The
 * paid pages are therefore rendered client-side from API routes that call
 * this function, so the content never leaves the server for a caller without
 * a verified token AND currently-active access. E-6 steps 1-2.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser, type VerifiedToken } from "@/lib/auth/verify-token";
import { canReadPaidContent } from "@/lib/permissions";
import { evaluateSubscriptionAccess } from "@/features/onboarding/domain";

export function userCanReadPaidContent(user: VerifiedToken): boolean {
  const access = evaluateSubscriptionAccess({
    subscription_status: user.subscriptionStatus,
    trial_ends_at: user.trialEndsAt,
    is_blocked: user.isBlocked,
  });
  return canReadPaidContent({ role: user.role, hasActiveAccess: access.hasAccess });
}

export type PaidContentAccess =
  | { ok: true; user: VerifiedToken }
  | { ok: false; response: NextResponse };

/** 401 without a verified token, 403 without active paid access, otherwise the verified user. */
export async function requirePaidContentAccess(request: NextRequest): Promise<PaidContentAccess> {
  const user = await getVerifiedUser(request.headers.get("authorization"));
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!userCanReadPaidContent(user)) {
    return { ok: false, response: NextResponse.json({ error: "Active subscription required" }, { status: 403 }) };
  }
  return { ok: true, user };
}
