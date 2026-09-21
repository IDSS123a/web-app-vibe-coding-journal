/**
 * GET /api/certificates: the certificates of completion with the ones the caller has earned (PDL-080). A certificate the caller
 * has earned but does not have yet is issued now. Any signed-in user may read their own (the same access as badges).
 * E-6: authenticate, authorize, execute, return.
 */
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { CERTIFICATES } from "@/features/certificates/domain";
import { ensureCertificates } from "@/features/certificates/repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mine = new Map((await ensureCertificates(user.sub)).map((c) => [c.kind, c]));
    return NextResponse.json({
      success: true,
      data: {
        certificates: CERTIFICATES.map((c) => ({
          kind: c.kind,
          title: c.title,
          programme: c.programme,
          statement: c.statement,
          howToEarn: c.howToEarn,
          earned: mine.has(c.kind),
          code: mine.get(c.kind)?.code ?? null,
          issuedAt: mine.get(c.kind)?.issued_at ?? null,
        })),
      },
    });
  } catch (err) {
    console.error(`[CERTIFICATES] Error fetching certificates: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
