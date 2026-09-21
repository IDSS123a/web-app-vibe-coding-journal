"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Article, DailyReport } from "@/lib/validation/schemas";
import { useAuthedJson } from "@/lib/auth/use-authed-json";
import { ArticleListWithBookmarks } from "@/components/ArticleListWithBookmarks";
import { ArticleScan } from "@/components/ArticleScan";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ReportHeader, dayKeyOf } from "@/components/ReportHeader";
import { DailyReportOpenTracker } from "@/components/rewards/DailyReportOpenTracker";
import { UpgradeToPremiumBanner } from "@/components/UpgradeToPremiumBanner";
import { RenewalBanner } from "@/components/RenewalBanner";
import { TrialBanner } from "@/components/TrialBanner";

/**
 * Dashboard — the most recent PUBLISHED Daily Report.
 *
 * Rendered client-side from GET /api/reports/latest (2026-09-19, Director:
 * "no payment → no access; $10 = one level; $50 = the highest"). This page
 * used to be a server component that fetched the report itself, so the
 * article text was in the page source for ANY visitor — the client-side
 * SubscriptionGuard only hid it visually. The session lives in the browser,
 * so the server cannot authenticate a page request; the content now comes
 * only from an API route that verifies the token and the subscription, and
 * this server-rendered shell contains no report data at all.
 *
 * P-6: only auto_published/manually_approved reports are ever returned —
 * held_for_review and rejected never reach a subscriber.
 */

interface ReportPayload {
  report: DailyReport | null;
  articles: Article[];
  relatedSources: Record<string, string[]>;
}

export default function DashboardPage() {
  const { data, loading, error } = useAuthedJson<ReportPayload>("/api/reports/latest");
  const report = data?.report ?? null;
  const articles = data?.articles ?? [];

  // Read (the Edition layout) or Scan (a dense table, the Console layer, PDL-082). The choice is remembered in this browser only.
  const [view, setView] = useState<"read" | "scan">("read");
  useEffect(() => {
    try {
      if (window.localStorage.getItem("vbj-report-view") === "scan") setView("scan");
    } catch {
      // Not remembered, which is harmless.
    }
  }, []);
  function chooseView(next: "read" | "scan") {
    setView(next);
    try {
      window.localStorage.setItem("vbj-report-view", next);
    } catch {
      // Not remembered, which is harmless.
    }
  }

  return (
    <div className="k-page layer-edition">
      {report && <DailyReportOpenTracker reportId={report.id} />}
      <div className="k-wide">
        {/* Header */}
        <div className="mb-12 border-b border-black pb-8">
          <p className="mb-2 text-signal k-label">
            Daily Digest
          </p>
          <h1 className="text-black k-display">
            Vibe-Coding Journal
          </h1>
          <p className="mt-2 text-sm text-black">
            Daily intelligence digest for vibe-coders
          </p>
        </div>

        <TrialBanner />
        <RenewalBanner />
        <UpgradeToPremiumBanner />

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p className="border border-signal p-3 text-sm text-signal">{error}</p>}

        {!loading && !error && !report && (
          <div className="border border-black p-4 sm:p-8 md:p-12">
            <p className="k-ui text-center text-ink-soft">
              No Daily Report has been published yet, check back soon.
            </p>
          </div>
        )}

        {/* Daily Report Card: the Edition layer (PDL-074). The day colour is the report's own signal (bar and badges). */}
        {report && (
          <div data-day={dayKeyOf(report.date)} className="k-box k-daybar p-4 sm:p-8 md:p-12">
            <ReportHeader
              report={report}
              status={report.review_status === "auto_published" || report.review_status === "manually_approved" ? "Published" : null}
            />

            {/* Structured, bookmarkable article list when available (migration
                009); raw markdown as the fallback for reports generated before
                that shipped, or if linking ever fails. */}
            {articles.length > 0 && (
              <div role="group" aria-label="How to view the report" className="mt-6 inline-flex border border-black">
                {(["read", "scan"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => chooseView(v)}
                    className={`inline-flex min-h-11 items-center px-5 text-xs font-bold uppercase tracking-widest transition-colors duration-150 ease-out ${view === v ? "bg-black text-white" : "bg-white text-black hover:bg-paper-2"}`}
                  >
                    {v === "read" ? "Read" : "Scan"}
                  </button>
                ))}
              </div>
            )}
            {articles.length > 0 ? (
              view === "scan" ? (
                <ArticleScan articles={articles} />
              ) : (
                <ArticleListWithBookmarks articles={articles} relatedSources={data?.relatedSources ?? {}} />
              )
            ) : (
              <div className="k-box-muted swiss-grid-pattern mt-6 p-6">
                <MarkdownContent className="k-cols">{report.markdown}</MarkdownContent>
              </div>
            )}

            {/* Sections */}
            <div className="mt-8 border-t border-black pt-6">
              <h3 className="k-label mb-3 text-signal">
                Sections
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.sections.map((section) => (
                  <span
                    key={section}
                    className="k-badge"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-0 text-black k-label">
          <Link href="/" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            ← Home
          </Link>
          <Link href="/archive" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            Archive
          </Link>
          <Link href="/bookmarks" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            My Bookmarks
          </Link>
          <Link href="/university" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            University
          </Link>
          <Link href="/dictionary" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            Dictionary
          </Link>
          <Link href="/assistant" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            Assistant
          </Link>
          <Link href="/prompt-school" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
            Prompt School
          </Link>
        </div>
      </div>
    </div>
  );
}
