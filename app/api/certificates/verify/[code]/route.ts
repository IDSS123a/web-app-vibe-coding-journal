/**
 * GET /api/certificates/verify/[code]: is this certificate real? Public on purpose, so an employer or a client can check one
 * (PDL-080). It answers with the programme and the issue date only, never who the certificate belongs to.
 * Errors: 404 for a code that is malformed or unknown (the same answer for both), 500.
 */
import { NextResponse } from "next/server";
import { normalizeCertificateCode } from "@/features/certificates/domain";
import { getCertificateByCode } from "@/features/certificates/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const code = normalizeCertificateCode((await params).code);
    if (!code) return NextResponse.json({ valid: false }, { status: 404 });
    const found = await getCertificateByCode(code);
    if (!found) return NextResponse.json({ valid: false }, { status: 404 });
    return NextResponse.json({ valid: true, title: found.title, programme: found.programme, issuedAt: found.issuedAt });
  } catch (err) {
    console.error(`[CERTIFICATES] Error verifying certificate: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 });
  }
}
