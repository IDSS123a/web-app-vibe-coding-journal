/**
 * Certificates (PDL-080): the certificates of completion, with the ones the caller has earned. Campus layer, like the rest of the
 * learning side. The list comes from GET /api/certificates, which also issues a certificate that has just been earned.
 */

"use client";

import Link from "next/link";
import { useAuthedJson } from "@/lib/auth/use-authed-json";

interface CertificateRow {
  kind: string;
  title: string;
  programme: string;
  howToEarn: string;
  earned: boolean;
  code: string | null;
  issuedAt: string | null;
}

export default function CertificatesPage() {
  const { data, loading, error } = useAuthedJson<{ certificates: CertificateRow[] }>("/api/certificates");

  return (
    <div className="k-page layer-campus">
      <div className="k-wide">
        <div className="mb-10 border-b border-studio-ink pb-8">
          <p className="mb-2 text-studio-blueberry k-clabel">Completion</p>
          <h1 className="k-cheading">Certificates</h1>
          <p className="k-cintro mt-3 max-w-2xl">
            Finish a whole programme and you get a certificate you can print or save as a PDF. Each one carries a code that anyone can check on this site.
          </p>
        </div>

        {loading && <p className="k-cbody">Loading…</p>}
        {error && <p role="alert" className="k-card-sm border-signal p-3 text-sm text-signal">{error}</p>}

        {data && (
          <ul className="k-cards-lg">
            {data.certificates.map((c) => (
              <li key={c.kind} className={`k-card p-5 sm:p-6 ${c.earned ? "" : "opacity-70"}`}>
                <p className="mb-1 text-studio-blueberry k-clabel">{c.earned ? "Earned" : "Locked"}</p>
                <h2 className="mb-2 text-studio-ink k-h4">{c.title}</h2>
                {c.earned && c.issuedAt ? (
                  <>
                    <p className="mb-4 text-sm text-studio-ink">
                      Issued {new Date(c.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Code <span className="font-mono">{c.code}</span>
                    </p>
                    <Link href={`/certificates/${c.kind}`} className="inline-flex min-h-11 items-center justify-center k-cbtn k-cbtn-primary">
                      View and print
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-studio-ink">{c.howToEarn}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
