/**
 * GET /api/me — "who am I" for the client-side admin guard.
 * Returns the caller's authenticated identity and whether they are an admin,
 * with the role read from user_profiles (M-7). Always 200; the body tells the
 * UI what to render. Never leaks anything beyond the caller's own role.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";

export async function GET(request: NextRequest) {
  const user = await getVerifiedUser(request.headers.get("authorization"));

  if (!user) {
    return NextResponse.json({ authenticated: false, isAdmin: false }, { status: 200 });
  }

  return NextResponse.json(
    { authenticated: true, isAdmin: user.isAdmin, email: user.email },
    { status: 200 },
  );
}
