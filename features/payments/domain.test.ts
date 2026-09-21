import { describe, expect, it } from "vitest";
import { checkFreshOrderEligibility, classifyPaymentWebhookEvent, classifyUpgradeEvent, computePurchaseExpiry } from "./domain";

const CAPTURE = "PAYMENT.CAPTURE.COMPLETED";

describe("classifyUpgradeEvent ($40 Basic->Premium upgrade)", () => {
  it("accepts a $40 capture from a current Basic subscriber as a premium activation", () => {
    expect(classifyUpgradeEvent(CAPTURE, 40, "basic")).toEqual({
      kind: "processed",
      tier: "premium",
      amountUsd: 40,
    });
  });

  it("does NOT treat $40 from an already-Premium user as an upgrade (falls through to ambiguous)", () => {
    expect(classifyUpgradeEvent(CAPTURE, 40, "premium")).toBeNull();
  });

  it("does NOT treat $40 from an unknown user as an upgrade", () => {
    expect(classifyUpgradeEvent(CAPTURE, 40, null)).toBeNull();
  });

  it("ignores any other amount, so ordinary $10/$50 purchases are untouched", () => {
    expect(classifyUpgradeEvent(CAPTURE, 10, "basic")).toBeNull();
    expect(classifyUpgradeEvent(CAPTURE, 50, "basic")).toBeNull();
    expect(classifyUpgradeEvent(CAPTURE, 39.99, "basic")).toBeNull();
  });

  it("ignores non-capture events even for $40 from a Basic user", () => {
    expect(classifyUpgradeEvent("CHECKOUT.ORDER.APPROVED", 40, "basic")).toBeNull();
    expect(classifyUpgradeEvent("PAYMENT.CAPTURE.DECLINED", 40, "basic")).toBeNull();
  });
});

describe("classifyPaymentWebhookEvent (unchanged exact-price behaviour)", () => {
  it("still classifies $10 as basic and $50 as premium", () => {
    expect(classifyPaymentWebhookEvent(CAPTURE, 10)).toEqual({ kind: "processed", tier: "basic", amountUsd: 10 });
    expect(classifyPaymentWebhookEvent(CAPTURE, 50)).toEqual({ kind: "processed", tier: "premium", amountUsd: 50 });
  });

  it("still treats a bare $40 as ambiguous -- an upgrade is only recognised with the payer's tier", () => {
    const result = classifyPaymentWebhookEvent(CAPTURE, 40);
    expect(result.kind).toBe("ambiguous");
  });
});

describe("who may start a payment (PDL-079)", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

  it("a trial or an ended plan can buy anything", () => {
    expect(checkFreshOrderEligibility("basic", { status: "trial", tier: "premium", expiresAt: null, now }).ok).toBe(true);
    expect(checkFreshOrderEligibility("premium", { status: "expired", tier: "basic", expiresAt: days(-3), now }).ok).toBe(true);
  });

  it("an active plan cannot be bought again before its last 14 days, but can be in them", () => {
    expect(checkFreshOrderEligibility("basic", { status: "active", tier: "basic", expiresAt: days(200), now }).ok).toBe(false);
    expect(checkFreshOrderEligibility("basic", { status: "active", tier: "basic", expiresAt: days(15), now }).ok).toBe(false);
    expect(checkFreshOrderEligibility("basic", { status: "active", tier: "basic", expiresAt: days(14), now }).ok).toBe(true);
    expect(checkFreshOrderEligibility("premium", { status: "active", tier: "premium", expiresAt: days(2), now }).ok).toBe(true);
  });

  it("Premium cannot be bought at full price over an active Basic, and Basic not over an active Premium", () => {
    expect(checkFreshOrderEligibility("premium", { status: "active", tier: "basic", expiresAt: days(3), now }).ok).toBe(false);
    expect(checkFreshOrderEligibility("basic", { status: "active", tier: "premium", expiresAt: days(3), now }).ok).toBe(false);
  });

  it("an active plan with no end date (granted by the admin) cannot be paid for again", () => {
    expect(checkFreshOrderEligibility("basic", { status: "active", tier: "basic", expiresAt: null, now }).ok).toBe(false);
  });

  it("an active status whose end date has passed counts as ended", () => {
    expect(checkFreshOrderEligibility("basic", { status: "active", tier: "basic", expiresAt: days(-1), now }).ok).toBe(true);
  });
});

describe("the end date after a payment (PDL-079)", () => {
  const now = new Date("2026-10-01T12:00:00Z");

  it("the $40 upgrade starts a NEW 12 months on the day it is paid, whatever was left of the Basic year", () => {
    const basicEnd = new Date("2027-08-15T00:00:00Z");
    expect(computePurchaseExpiry("upgrade", { status: "active", expiresAt: basicEnd, now }).toISOString()).toBe("2027-10-01T12:00:00.000Z");
  });

  it("a first purchase or one after the plan ended starts on the day it is paid", () => {
    expect(computePurchaseExpiry("purchase", { status: "trial", expiresAt: null, now }).toISOString()).toBe("2027-10-01T12:00:00.000Z");
    expect(computePurchaseExpiry("purchase", { status: "expired", expiresAt: new Date("2026-09-01T00:00:00Z"), now }).toISOString()).toBe("2027-10-01T12:00:00.000Z");
  });

  it("an early renewal starts when the current year ends, so nothing paid for is lost", () => {
    const end = new Date("2026-10-05T00:00:00Z");
    expect(computePurchaseExpiry("purchase", { status: "active", expiresAt: end, now }).toISOString()).toBe("2027-10-05T00:00:00.000Z");
  });
});
