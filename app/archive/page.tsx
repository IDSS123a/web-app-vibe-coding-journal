"use client";

import Link from "next/link";
import { useState } from "react";
import type { DailyReport } from "@/lib/validation/schemas";
import { useAuthedJson } from "@/lib/auth/use-authed-json";

/**
 * Archive — paginated list of past Daily Reports (Sprint 10).
 * P-6: GET /api/reports only ever returns auto_published/manually_approved
 * reports — never held_for_review or rejected.
 * Paid content (2026-09-19): rendered client-side from the server-side-
 * paywalled API instead of a server component, so nothing is in the page
 * source for an unpaid or anonymous visitor (see features/daily-report/access.ts).
 */

interface ArchivePayload {
  reports: DailyReport[];
  hasMore: boolean;
}

export default function ArchivePage() {
  const [page, setPage] = useState(0);
  const { data, loading, error } = useAuthedJson<ArchivePayload>(`/api/reports?page=${page}`);
  const reports = data?.reports ?? [];
  const hasMore = data?.hasMore ?? false;

  return (
    <div className="min-h-dvh bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-4xl xl:max-w-5xl">
        <div className="mb-12 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
            Record
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Archive</h1>
          <p className="mt-2 text-sm text-black">Past Daily Reports</p>
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

        {!loading && !error && reports.length === 0 && (
          <p className="border-4 border-black py-16 text-center text-sm italic text-black opacity-60">
            No past reports yet.
          </p>
        )}

        {reports.length > 0 && (
          <div className="border-black md:border-4">
            {reports.map((report, i) => (
              <a
                key={report.id}
                href={`/archive/${report.date}`}
                className={`group block border-4 border-black p-6 transition-colors duration-150 ease-out hover:bg-black ${
                  i > 0 ? "border-t-0" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-wide text-black group-hover:text-white">
                    {new Date(report.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <span className="text-xs text-black group-hover:text-[#F2F2F2]">
                    {report.article_count} articles · {report.reading_time_minutes || "< 1"} min read
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
          {page > 0 ? (
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
            >
              ← Newer
            </button>
          ) : (
            <span />
          )}
          {hasMore && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
            >
              Older →
            </button>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-6 text-xs font-bold uppercase tracking-widest text-black">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            ← Dashboard
          </Link>
          <Link href="/bookmarks" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            My Bookmarks
          </Link>
        </div>
      </div>
    </div>
  );
}
