import { describe, expect, it } from "vitest";
import { paypalApiBase, resolvePayPalMode } from "./paypal-mode";

describe("PayPal mode (PDL-079)", () => {
  it("is the sandbox by default", () => {
    expect(resolvePayPalMode({})).toBe("sandbox");
    expect(paypalApiBase({})).toBe("https://api-m.sandbox.paypal.com");
  });

  it("is live only with PAYPAL_MODE=live on Vercel Production", () => {
    expect(resolvePayPalMode({ PAYPAL_MODE: "live", VERCEL_ENV: "production" })).toBe("live");
    expect(paypalApiBase({ PAYPAL_MODE: "live", VERCEL_ENV: "production" })).toBe("https://api-m.paypal.com");
  });

  it("a copied .env, a laptop or a preview deployment can never reach live, whatever PAYPAL_MODE says", () => {
    expect(resolvePayPalMode({ PAYPAL_MODE: "live" })).toBe("sandbox");
    expect(resolvePayPalMode({ PAYPAL_MODE: "live", VERCEL_ENV: "preview" })).toBe("sandbox");
    expect(resolvePayPalMode({ PAYPAL_MODE: "live", VERCEL_ENV: "development" })).toBe("sandbox");
  });

  it("anything other than the exact word live is the sandbox", () => {
    for (const v of ["", "LIVE", "true", "1", "production", " live"]) {
      expect(resolvePayPalMode({ PAYPAL_MODE: v, VERCEL_ENV: "production" }), v).toBe("sandbox");
    }
  });
});
