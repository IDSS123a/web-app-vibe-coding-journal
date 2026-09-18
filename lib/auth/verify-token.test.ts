import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression tests for the 2026-09-18 auth bypass: getVerifiedUser used to
// trust an unverified, hand-built JWT. It must now rely on Supabase Auth
// (auth.getUser) to authenticate, and on user_profiles only for the role.

const getUser = vi.fn();
const single = vi.fn();

vi.mock("@/lib/db/client", () => ({
  supabaseAdmin: {
    auth: { getUser: (...args: unknown[]) => getUser(...args) },
    from: () => ({ select: () => ({ eq: () => ({ single: () => single() }) }) }),
  },
}));

import { getVerifiedUser, verifyAdminToken } from "./verify-token";

function forgedToken(sub: string): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, exp, role: "authenticated" })}.AAAAAAAA`;
}

const ADMIN_ID = "b623b09e-4dea-4f61-9a36-c27c9c5754af";
const adminProfile = {
  role: "admin",
  subscription_status: "active",
  trial_ends_at: null,
  subscription_tier: "premium",
  is_blocked: false,
};

beforeEach(() => {
  getUser.mockReset();
  single.mockReset();
});

describe("getVerifiedUser", () => {
  it("rejects a forged token carrying a real admin id when Supabase Auth refuses it", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid JWT: signature is invalid" } });
    single.mockResolvedValue({ data: adminProfile, error: null }); // must never be reached

    const result = await getVerifiedUser(`Bearer ${forgedToken(ADMIN_ID)}`);

    expect(result).toBeNull();
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(single).not.toHaveBeenCalled(); // never even looks up the role for an unverified token
  });

  it("rejects a forged token for the admin from verifyAdminToken as well", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "bad" } });
    expect(await verifyAdminToken(`Bearer ${forgedToken(ADMIN_ID)}`)).toBeNull();
  });

  it("accepts a token Supabase Auth verified and takes the role from user_profiles", async () => {
    getUser.mockResolvedValue({ data: { user: { id: ADMIN_ID, email: "a@b.c" } }, error: null });
    single.mockResolvedValue({ data: adminProfile, error: null });

    const result = await getVerifiedUser("Bearer real.token.value");

    expect(result).toMatchObject({ sub: ADMIN_ID, email: "a@b.c", role: "admin", isAdmin: true, isBlocked: false });
  });

  it("does not trust a role claim inside the token: a verified non-admin stays non-admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@x.y" } }, error: null });
    single.mockResolvedValue({ data: { ...adminProfile, role: "user" }, error: null });

    const result = await getVerifiedUser(`Bearer ${forgedToken(ADMIN_ID)}`);

    expect(result?.isAdmin).toBe(false);
    expect(await verifyAdminToken(`Bearer ${forgedToken(ADMIN_ID)}`)).toBeNull();
  });

  it("returns null when a verified user has no profile row", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@x.y" } }, error: null });
    single.mockResolvedValue({ data: null, error: { message: "not found" } });
    expect(await getVerifiedUser("Bearer real.token.value")).toBeNull();
  });

  it("returns null for a missing or malformed Authorization header without calling Supabase", async () => {
    expect(await getVerifiedUser(null)).toBeNull();
    expect(await getVerifiedUser("Basic abc")).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });
});
