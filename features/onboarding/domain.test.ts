import { describe, expect, it } from "vitest";
import { evaluateSubscriptionAccess } from "./domain";

describe("evaluateSubscriptionAccess", () => {
  it("grants access for an active subscription", () => {
    const result = evaluateSubscriptionAccess({ subscription_status: "active", trial_ends_at: null });
    expect(result).toEqual({ hasAccess: true, reason: "active_subscription" });
  });

  it("grants access during an active trial", () => {
    const now = new Date("2026-01-15T00:00:00Z");
    const result = evaluateSubscriptionAccess(
      { subscription_status: "trial", trial_ends_at: "2026-01-20T00:00:00Z" },
      now,
    );
    expect(result).toEqual({ hasAccess: true, reason: "trial_active" });
  });

  it("denies access once the trial end date has passed", () => {
    const now = new Date("2026-01-25T00:00:00Z");
    const result = evaluateSubscriptionAccess(
      { subscription_status: "trial", trial_ends_at: "2026-01-20T00:00:00Z" },
      now,
    );
    expect(result).toEqual({ hasAccess: false, reason: "trial_expired" });
  });

  it("denies access for a trial with no trial_ends_at set at all", () => {
    const result = evaluateSubscriptionAccess({ subscription_status: "trial", trial_ends_at: null });
    expect(result).toEqual({ hasAccess: false, reason: "trial_expired" });
  });

  it("denies access for an expired subscription -- no degraded read-only mode (P-13)", () => {
    const result = evaluateSubscriptionAccess({ subscription_status: "expired", trial_ends_at: null });
    expect(result).toEqual({ hasAccess: false, reason: "subscription_expired" });
  });

  it("treats the exact trial-end instant as already expired (strict >, not >=)", () => {
    const boundary = new Date("2026-01-20T00:00:00Z");
    const result = evaluateSubscriptionAccess(
      { subscription_status: "trial", trial_ends_at: boundary.toISOString() },
      boundary,
    );
    expect(result.hasAccess).toBe(false);
  });

  it("blocks access even for an otherwise-active subscription (Admin Console, migration 020)", () => {
    const result = evaluateSubscriptionAccess({
      subscription_status: "active",
      trial_ends_at: null,
      is_blocked: true,
    });
    expect(result).toEqual({ hasAccess: false, reason: "blocked" });
  });

  it("is unaffected by is_blocked: false (explicit) or omitted", () => {
    const explicit = evaluateSubscriptionAccess({
      subscription_status: "active",
      trial_ends_at: null,
      is_blocked: false,
    });
    expect(explicit).toEqual({ hasAccess: true, reason: "active_subscription" });

    const omitted = evaluateSubscriptionAccess({ subscription_status: "active", trial_ends_at: null });
    expect(omitted).toEqual({ hasAccess: true, reason: "active_subscription" });
  });
});
