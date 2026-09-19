import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BASIC_PRICE_USD, PREMIUM_PRICE_USD, UPGRADE_PRICE_USD, centsPerDay, perMonthUsd } from "./pricing";
import { BASIC_TO_PREMIUM_UPGRADE_PRICE_USD } from "@/features/subscription-lifecycle/domain";

describe("displayed prices match what is charged", () => {
  it("the upgrade price equals the server constant", () => {
    expect(UPGRADE_PRICE_USD).toBe(BASIC_TO_PREMIUM_UPGRADE_PRICE_USD);
  });

  it("the tier prices equal the amounts sent to PayPal", () => {
    const src = readFileSync("lib/payments/paypal-client.ts", "utf8");
    expect(src).toContain(`basic: "${BASIC_PRICE_USD}.00"`);
    expect(src).toContain(`premium: "${PREMIUM_PRICE_USD}.00"`);
  });

  it("the upgrade is the difference between the tiers", () => {
    expect(PREMIUM_PRICE_USD - BASIC_PRICE_USD).toBe(UPGRADE_PRICE_USD);
  });
});

describe("price framing", () => {
  it("$50 a year is about 14 cents a day and $4.17 a month", () => {
    expect(centsPerDay(50)).toBe(14);
    expect(perMonthUsd(50)).toBe("4.17");
  });
});
