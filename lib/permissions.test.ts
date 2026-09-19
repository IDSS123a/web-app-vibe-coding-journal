import { describe, expect, it } from "vitest";
import {
  PermissionDenied,
  canAccessAdminPanel,
  canApproveReports,
  canRejectReports,
  canAccessPromptAssistant,
  canAccessPromptSchool,
  canAccessUniversity,
  canReadPaidContent,
  isBillingExempt,
  requireAuth,
} from "./permissions";
import type { UserProfile } from "@/lib/validation/schemas";

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "user@example.com",
    role: "user",
    tools_used: ["ai_assisted_ide"],
    depth_preference: "simple",
    other_tools_freetext: null,
    subscription_status: "active",
    trial_started_at: null,
    trial_ends_at: null,
    subscription_expires_at: null,
    subscription_tier: "basic",
    is_blocked: false,
    created_by_admin_id: null,
    coin_balance: 0,
    current_streak: 0,
    longest_streak: 0,
    level: 1,
    last_active_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("requireAuth", () => {
  it("returns the user when authenticated", () => {
    const user = makeUser();
    expect(requireAuth({ user })).toBe(user);
  });

  it("throws PermissionDenied when not authenticated", () => {
    expect(() => requireAuth({ user: null })).toThrow(PermissionDenied);
  });
});

describe("role-gated checks (admin only: canAccessAdminPanel/canApproveReports/canRejectReports)", () => {
  it.each([
    ["canAccessAdminPanel", canAccessAdminPanel],
    ["canApproveReports", canApproveReports],
    ["canRejectReports", canRejectReports],
  ] as const)("%s is true for an admin", (_name, fn) => {
    expect(fn({ user: makeUser({ role: "admin" }) })).toBe(true);
  });

  it.each([
    ["canAccessAdminPanel", canAccessAdminPanel],
    ["canApproveReports", canApproveReports],
    ["canRejectReports", canRejectReports],
  ] as const)("%s is false for a regular user", (_name, fn) => {
    expect(fn({ user: makeUser({ role: "user" }) })).toBe(false);
  });

  it.each([
    ["canAccessAdminPanel", canAccessAdminPanel],
    ["canApproveReports", canApproveReports],
    ["canRejectReports", canRejectReports],
  ] as const)("%s is false when unauthenticated", (_name, fn) => {
    expect(fn({ user: null })).toBe(false);
  });
});

describe("access levels: no payment -> nothing, Basic -> daily content, Premium -> everything", () => {
  const active = { role: "user", hasActiveAccess: true };
  const inactive = { role: "user", hasActiveAccess: false };

  it("canReadPaidContent: an unpaid/expired/blocked user (no active access) is refused", () => {
    expect(canReadPaidContent(inactive)).toBe(false);
  });

  it("canReadPaidContent: any tier with active access may read (Basic and Premium alike)", () => {
    expect(canReadPaidContent(active)).toBe(true);
  });

  it("canReadPaidContent: an admin is always allowed (billing-exempt, P-14)", () => {
    expect(canReadPaidContent({ role: "admin", hasActiveAccess: false })).toBe(true);
  });

  it("Basic ($10) with active access reads daily content but NOT University or the Assistant", () => {
    const basic = { ...active, subscriptionTier: "basic" as const };
    expect(canReadPaidContent(basic)).toBe(true);
    expect(canAccessUniversity(basic)).toBe(false);
    expect(canAccessPromptAssistant(basic)).toBe(false);
    expect(canAccessPromptSchool(basic)).toBe(false);
  });

  it("Premium ($50) with active access reads everything", () => {
    const premium = { ...active, subscriptionTier: "premium" as const };
    expect(canReadPaidContent(premium)).toBe(true);
    expect(canAccessUniversity(premium)).toBe(true);
    expect(canAccessPromptAssistant(premium)).toBe(true);
    expect(canAccessPromptSchool(premium)).toBe(true);
  });

  it("Premium tier WITHOUT active access (lapsed) gets nothing at any level", () => {
    const lapsed = { ...inactive, subscriptionTier: "premium" as const };
    expect(canReadPaidContent(lapsed)).toBe(false);
    expect(canAccessUniversity(lapsed)).toBe(false);
    expect(canAccessPromptAssistant(lapsed)).toBe(false);
    expect(canAccessPromptSchool(lapsed)).toBe(false);
  });
});

describe("isBillingExempt", () => {
  it("is true only for admin, an explicit auditable check (P-13)", () => {
    expect(isBillingExempt({ role: "admin" })).toBe(true);
  });

  it("is false for a regular user", () => {
    expect(isBillingExempt({ role: "user" })).toBe(false);
  });

  it("is false when unauthenticated", () => {
    expect(isBillingExempt(null)).toBe(false);
  });
});
