import { describe, expect, it } from "vitest";
import {
  PermissionDenied,
  canAccessAdminPanel,
  canApproveReports,
  canRejectReports,
  canSaveArticle,
  canViewDailyReport,
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

describe("canViewDailyReport / canSaveArticle (any authenticated user)", () => {
  it("is true for any authenticated user, admin or not", () => {
    expect(canViewDailyReport({ user: makeUser({ role: "user" }) })).toBe(true);
    expect(canSaveArticle({ user: makeUser({ role: "user" }) })).toBe(true);
  });

  it("is false when unauthenticated", () => {
    expect(canViewDailyReport({ user: null })).toBe(false);
    expect(canSaveArticle({ user: null })).toBe(false);
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
