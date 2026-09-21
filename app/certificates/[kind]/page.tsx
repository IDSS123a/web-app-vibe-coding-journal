/**
 * One certificate, ready to print or save as a PDF (PDL-080). The holder types the name to print; it is kept only in this browser
 * (local storage) and is never sent to us, so the page can be used without us holding a name at all. Everything except the
 * certificate itself is hidden when printing.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthedJson } from "@/lib/auth/use-authed-json";
import { SITE_NAME, SITE_URL, STUDIO } from "@/lib/site";

interface CertificateRow {
  kind: string;
  title: string;
  programme: string;
  statement: string;
  earned: boolean;
  code: string | null;
  issuedAt: string | null;
}

const NAME_KEY = "vbj-certificate-name";

export default function CertificatePage() {
  const { kind } = useParams<{ kind: string }>();
  const { data, loading, error } = useAuthedJson<{ certificates: CertificateRow[] }>("/api/certificates");
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      setName(window.localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      // Not remembered: the holder types the name again.
    }
  }, []);

  function changeName(value: string) {
    setName(value);
    try {
      window.localStorage.setItem(NAME_KEY, value);
    } catch {
      // Not remembered, which is harmless.
    }
  }

  const cert = data?.certificates.find((c) => c.kind === kind);
  const issued = cert?.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div className="k-page layer-campus">
      {/* When printing, only the certificate is shown, on one landscape page. */}
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        @media print {
          body * { visibility: hidden !important; }
          .cert-print, .cert-print * { visibility: visible !important; }
          .cert-print { position: absolute; left: 0; top: 0; width: 277mm !important; height: 190mm !important; max-width: none !important; aspect-ratio: auto !important; margin: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="k-wide">
        <Link href="/certificates" className="mb-6 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-cbtn">
          ← Certificates
        </Link>

        {loading && <p className="k-cbody">Loading…</p>}
        {error && <p role="alert" className="k-card-sm border-signal p-3 text-sm text-signal">{error}</p>}
        {data && !cert?.earned && (
          <p className="k-cbody">You have not earned this certificate yet. {cert ? "" : "It was not found."}</p>
        )}

        {data && cert?.earned && (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="block flex-1 sm:max-w-md">
                <span className="mb-1 block text-studio-ink k-clabel">Name to print on the certificate</span>
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => changeName(e.target.value)}
                  placeholder="Your full name"
                  className="block min-h-11 w-full k-card p-3 text-sm text-studio-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal"
                />
                <span className="mt-1 block text-xs text-studio-ink opacity-60">Kept only in this browser, not sent to us.</span>
              </label>
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center k-cbtn k-cbtn-primary">
                Print or save as PDF
              </button>
            </div>

            <article
              className="cert-print mx-auto flex aspect-[297/210] w-full max-w-5xl flex-col items-center justify-between border-[10px] border-double border-studio-ink bg-white p-6 text-center text-studio-ink sm:p-10"
              aria-label={cert.title}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-studio-blueberry sm:text-sm">{SITE_NAME}</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-5xl">Certificate of completion</h2>
              </div>
              <div className="w-full">
                <p className="text-xs sm:text-base">This certifies that</p>
                <p className="my-2 min-h-[1.4em] break-words border-b-2 border-studio-ink px-4 font-serif text-2xl italic sm:my-4 sm:text-5xl">{name.trim() || " "}</p>
                <p className="mx-auto max-w-3xl text-xs leading-relaxed sm:text-lg">{cert.statement}</p>
                <p className="mt-2 font-display text-lg font-extrabold sm:mt-4 sm:text-3xl">{cert.programme}</p>
              </div>
              <div className="flex w-full flex-col items-center justify-between gap-2 text-[10px] sm:flex-row sm:text-sm">
                <p className="whitespace-nowrap">Issued {issued}</p>
                <p className="font-mono">
                  <span className="block">Code {cert.code}</span>
                  <span className="block whitespace-nowrap">Check it at {SITE_URL.replace(/^https?:\/\//, "")}/verify/{cert.code}</span>
                </p>
                <p className="whitespace-nowrap">{STUDIO.name}</p>
              </div>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
