import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidCronSecret } from "./auth";

const ORIGINAL = process.env.CRON_SECRET;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL;
  vi.restoreAllMocks();
});

describe("isValidCronSecret", () => {
  it("accepts the configured secret as a Bearer token", () => {
    process.env.CRON_SECRET = "s3cret-value";
    expect(isValidCronSecret("Bearer s3cret-value")).toBe(true);
  });

  it("rejects a wrong secret, a wrong-length secret and a bare secret", () => {
    process.env.CRON_SECRET = "s3cret-value";
    expect(isValidCronSecret("Bearer nope-nope-no")).toBe(false);
    expect(isValidCronSecret("Bearer short")).toBe(false);
    expect(isValidCronSecret("s3cret-value")).toBe(false);
    expect(isValidCronSecret("Basic s3cret-value")).toBe(false);
    expect(isValidCronSecret("Bearer s3cret-value extra")).toBe(false);
  });

  it("rejects a missing header", () => {
    process.env.CRON_SECRET = "s3cret-value";
    expect(isValidCronSecret(null)).toBe(false);
    expect(isValidCronSecret("")).toBe(false);
  });

  it("FAILS CLOSED when CRON_SECRET is not configured -- the old built-in default no longer opens the endpoints (S5)", () => {
    delete process.env.CRON_SECRET;
    expect(isValidCronSecret("Bearer dev-secret-change-in-production")).toBe(false);
    expect(isValidCronSecret("Bearer ")).toBe(false);
    expect(isValidCronSecret(null)).toBe(false);
  });

  it("an empty CRON_SECRET counts as not configured", () => {
    process.env.CRON_SECRET = "";
    expect(isValidCronSecret("Bearer ")).toBe(false);
  });
});
