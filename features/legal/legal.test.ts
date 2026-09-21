/**
 * The legal pages (PDL-079): they must stay true to the code and follow the project's rules.
 */
import { describe, expect, it } from "vitest";
import { LEGAL_PAGES, LEGAL_UPDATED, REFUND_DAYS } from "./content";
import { RENEWAL_WINDOW_DAYS } from "@/features/payments/domain";
import { BASIC_PRICE_USD, PREMIUM_PRICE_USD, TRIAL_DAYS, UPGRADE_PRICE_USD } from "@/lib/pricing";
import { PUBLIC_PATHS, STUDIO } from "@/lib/site";
import { SANDBOX_DAILY_CAP_PER_USER } from "@/features/prompt-school/sandbox-limits";
import { ASSISTANT_DAILY_CAP_PER_USER } from "@/features/prompt-assistant/domain";

const byPath = (p: string) => LEGAL_PAGES.find((x) => x.path === p)!.markdown;

describe("legal pages", () => {
  it("there are five, and every one is a public, indexable path", () => {
    expect(LEGAL_PAGES.map((p) => p.path).sort()).toEqual(["/cookies", "/privacy", "/refunds", "/subscription", "/terms"]);
    for (const p of LEGAL_PAGES) expect(PUBLIC_PATHS as readonly string[]).toContain(p.path);
  });

  it("uses no dashes, the project's writing rule", () => {
    const dash = /—|–| -- /;
    for (const p of LEGAL_PAGES) expect(dash.test(p.markdown), p.path).toBe(false);
  });

  it("never names the studio's real location or organisation (business location privacy, PDL-015)", () => {
    const forbidden = /sarajevo|bosnia|bosna|idss|internationale deutsche/i;
    for (const p of LEGAL_PAGES) expect(forbidden.test(p.markdown), p.path).toBe(false);
  });

  it("every page can be reached to the studio by e-mail", () => {
    for (const p of LEGAL_PAGES) expect(p.markdown, p.path).toContain(STUDIO.email);
  });

  it("states the fixed prices exactly as they are charged", () => {
    expect(BASIC_PRICE_USD).toBe(10);
    expect(PREMIUM_PRICE_USD).toBe(50);
    expect(UPGRADE_PRICE_USD).toBe(40);
    const sub = byPath("/subscription");
    expect(sub).toContain("$10 a year");
    expect(sub).toContain("$50 a year");
    expect(sub).toContain("$40 once");
    expect(byPath("/terms")).toContain("$40");
  });

  it("says the upgrade starts a new 12 months on the day of the $40 payment, and that plans do not renew by themselves", () => {
    expect(byPath("/subscription")).toMatch(/new 12 months start on the day you pay the \$40/);
    expect(byPath("/subscription")).toMatch(/does not renew by itself/);
    expect(byPath("/terms")).toMatch(/does \*\*not\*\* renew by itself/);
  });

  it("explains early renewal and that an active plan cannot be paid for twice", () => {
    expect(byPath("/subscription")).toContain(`last ${RENEWAL_WINDOW_DAYS} days`);
    expect(byPath("/subscription")).toMatch(/nothing you paid for is lost/);
  });

  it("the numbers in the text are the numbers in the code", () => {
    expect(byPath("/terms")).toContain(`${ASSISTANT_DAILY_CAP_PER_USER} prompts a day`);
    expect(byPath("/terms")).toContain(`${SANDBOX_DAILY_CAP_PER_USER} runs a day`);
    expect(byPath("/terms")).toContain(`${TRIAL_DAYS} days with Premium access`);
    expect(byPath("/refunds")).toContain(`${REFUND_DAYS} days`);
  });

  it("the privacy policy covers the GDPR rights, the processors and the AI provider warning", () => {
    const pv = byPath("/privacy");
    for (const word of ["access", "erased", "portability", "object", "complain", "Supabase", "Vercel", "PayPal", "Resend", "Google", "standard contractual clauses"]) {
      expect(pv, word).toContain(word);
    }
    expect(pv).toMatch(/Google may use such content/);
    expect(pv).toMatch(/not\*\* stored by us/);
  });

  it("the cookie notice says there is no tracking and lists what is stored", () => {
    const ck = byPath("/cookies");
    expect(ck).toMatch(/do not use advertising, tracking or analytics cookies/);
    expect(ck).toContain("local storage");
    expect(ck).toContain("PayPal");
  });

  it("carries a version date", () => {
    expect(LEGAL_UPDATED).toMatch(/^\d{1,2} [A-Z][a-z]+ \d{4}$/);
  });
});
