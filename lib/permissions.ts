import type { UserProfile } from "@/lib/validation/schemas";

export interface PermissionContext {
  user: UserProfile | null;
  userId?: string;
}

export class PermissionDenied extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDenied";
  }
}

// M-7: Single source of truth for authorization checks
// All permission logic flows through these functions.

export function requireAuth(context: PermissionContext): UserProfile {
  if (!context.user) {
    throw new PermissionDenied("Authentication required");
  }
  return context.user;
}

// Access levels (Director, 2026-09-19): no payment -> no access; $10 Basic ->
// Daily Report, Archive, Bookmarks; $50 Premium -> all of that PLUS
// University, Dictionary and the Vibe-Coding Assistant (see
// hasPremiumTierAccess below). This is the Basic level: any tier with
// currently active access (paid subscription or the P-13 trial), or an
// admin. The two functions that used to live here ("any authenticated user
// can view daily reports / save articles") were the opposite of this rule
// and were only ever exercised by tests, so they were removed rather than
// left around as a misleading source of truth (M-7).
export function canReadPaidContent(user: { role: string; hasActiveAccess: boolean }): boolean {
  if (isBillingExempt({ role: user.role })) return true;
  return user.hasActiveAccess;
}

export function canAccessAdminPanel(context: PermissionContext): boolean {
  // E-4: Admin role required for admin panel access
  if (!context.user) return false;
  return context.user.role === "admin";
}

export function canApproveReports(context: PermissionContext): boolean {
  // Admin role required to approve held reports
  if (!context.user) return false;
  return context.user.role === "admin";
}

export function canRejectReports(context: PermissionContext): boolean {
  // Admin role required to reject held reports
  if (!context.user) return false;
  return context.user.role === "admin";
}

// P-13: "Admin accounts (P-14) are billing-exempt. The exemption must be
// an explicit, auditable check ... never an accidental side-effect of role
// logic living somewhere else." This is that check — the sole place the
// subscription/paywall gate is allowed to bypass on role, so the exemption
// stays visible and searchable rather than an inline `role === "admin"`
// scattered next to unrelated logic.
//
// Takes a narrower shape than PermissionContext deliberately — the only
// caller (the /api/me subscription-gate composition) has a verified token,
// not a full UserProfile, and this check only ever needs the role.
export function isBillingExempt(user: { role: string } | null): boolean {
  if (!user) return false;
  return user.role === "admin";
}

// M-7: single source of truth for the "$50/year premium tier or admin"
// boolean, shared by every premium-gated feature (University, the
// Vibe-Coding Assistant chatbot, and any future one). Individual
// features still get their own named wrapper below rather than calling
// this directly -- callers read "canAccessUniversity" or
// "canAccessPromptAssistant" and know exactly what's being gated
// without re-deriving it from a generic tier check, and the two can
// diverge later (e.g. a future tier split) without every call site
// needing to change.
function hasPremiumTierAccess(user: {
  role: string;
  subscriptionTier: "basic" | "premium";
  hasActiveAccess: boolean;
}): boolean {
  if (isBillingExempt({ role: user.role })) return true;
  return user.hasActiveAccess && user.subscriptionTier === "premium";
}

// Vibe-Coding University + Dictionary (specs/vibe-coding-university/
// SPEC.md, confirmed 2026-09-14): Premium-only, distinct from the
// general subscription-access check (/api/me's hasAccess) which does
// not distinguish tiers. Admin exemption (isBillingExempt) still
// applies -- an admin has "sve privilegije" (P-14), not a partial set.
export function canAccessUniversity(user: {
  role: string;
  subscriptionTier: "basic" | "premium";
  hasActiveAccess: boolean;
}): boolean {
  return hasPremiumTierAccess(user);
}

// Vibe-Coding Assistant chatbot (specs/prompt-blueprint-builder/,
// resolves CONSTITUTION.md P-19, DECISION_LOG.md PDL-046): same
// $50/year premium-tier gate as University -- confirmed with the
// Director as the SAME tier, not a separate one (PDL-046).
export function canAccessPromptAssistant(user: {
  role: string;
  subscriptionTier: "basic" | "premium";
  hasActiveAccess: boolean;
}): boolean {
  return hasPremiumTierAccess(user);
}
