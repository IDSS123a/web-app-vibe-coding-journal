import { describe, expect, it } from "vitest";
import { classifyPaymentWebhookEvent, classifyUpgradeEvent } from "./domain";

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
