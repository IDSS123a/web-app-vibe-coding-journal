/**
 * /verify/[code]: the public page for checking a certificate (PDL-080). It says whether the code is real, for which programme and
 * from which date. It never shows who holds the certificate, and it is kept out of search engines.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { normalizeCertificateCode } from "@/features/certificates/domain";
import { getCertificateByCode } from "@/features/certificates/repository";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Verify a certificate | ${SITE_NAME}`, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const raw = (await params).code;
  const code = normalizeCertificateCode(decodeURIComponent(raw));
  let found: Awaited<ReturnType<typeof getCertificateByCode>> = null;
  let failed = false;
  if (code) {
    try {
      found = await getCertificateByCode(code);
    } catch {
      failed = true;
    }
  }

  return (
    <div className="k-page layer-campus">
      <div className="k-wide">
        <p className="mb-2 text-studio-blueberry k-clabel">Certificate check</p>
        <h1 className="mb-6 text-studio-ink k-cheading">{found ? "This certificate is genuine" : failed ? "Could not check right now" : "No certificate with this code"}</h1>

        {found && (
          <div className="k-card max-w-2xl p-5 sm:p-6">
            <p className="text-studio-ink k-h4">{found.title}</p>
            <p className="mt-2 text-sm text-studio-ink">
              Issued by {SITE_NAME} on{" "}
              {new Date(found.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
            </p>
            <p className="mt-2 text-sm text-studio-ink">Code: <span className="font-mono">{code}</span></p>
            <p className="mt-4 text-xs text-studio-ink opacity-70">
              This page confirms the programme and the date. The name on a printed certificate is entered by its holder and is not checked here.
            </p>
          </div>
        )}
        {!found && !failed && (
          <p className="max-w-2xl text-sm text-studio-ink">
            {code ? "This code is not one we have issued." : "That does not look like a certificate code. A code looks like VBJ-ABCDE-FGHJK."} Check that it was typed exactly as printed.
          </p>
        )}
        {failed && <p className="max-w-2xl text-sm text-studio-ink">Please try again in a minute.</p>}

        <Link href="/" className="mt-8 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-cbtn">
          {SITE_NAME}
        </Link>
      </div>
    </div>
  );
}
