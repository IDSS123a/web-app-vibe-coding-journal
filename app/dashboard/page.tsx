"use client";

import type { Article, DailyReport } from "@/lib/validation/schemas";
import { formatPublicTimestamp } from "@/lib/time/format-public-timestamp";
import { useAuthedJson } from "@/lib/auth/use-authed-json";
import { ArticleListWithBookmarks } from "@/components/ArticleListWithBookmarks";
import { MarkdownContent } from "@/components/MarkdownContent";
import { DailyReportOpenTracker } from "@/components/rewards/DailyReportOpenTracker";
import { UpgradeToPremiumBanner } from "@/components/UpgradeToPremiumBanner";

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

  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      {report && <DailyReportOpenTracker reportId={report.id} />}
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
            Daily Digest
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black md:text-5xl">
            Vibe-Coding Journal
          </h1>
          <p className="mt-2 text-sm text-black">
            Automated daily intelligence digest for vibe-coders
          </p>
        </div>

        <UpgradeToPremiumBanner />

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

        {!loading && !error && !report && (
          <div className="border-4 border-black p-4 sm:p-8 md:p-12">
            <p className="text-center text-sm italic text-black opacity-60">
              No Daily Report has been published yet — check back soon.
            </p>
          </div>
        )}

        {/* Daily Report Card */}
        {report && (
          <div className="border-4 border-black p-4 sm:p-8 md:p-12">
            {/* Meta info */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-black">
                  {new Date(report.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="mt-1 text-sm text-black">
                  {report.article_count} articles • {report.reading_time_minutes || "< 1"} min read
                </p>
                <p className="mt-1 text-xs text-black opacity-60">
                  Updated {formatPublicTimestamp(report.updated_at)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-widest text-black">
                  {report.review_status === "auto_published" && "Auto-published"}
                  {report.review_status === "manually_approved" && "Approved"}
                </span>
              </div>
            </div>

            {/* Structured, bookmarkable article list when available (migration
                009); raw markdown as the fallback for reports generated before
                that shipped, or if linking ever fails. */}
            {articles.length > 0 ? (
              <ArticleListWithBookmarks articles={articles} relatedSources={data?.relatedSources ?? {}} />
            ) : (
              <div className="swiss-grid-pattern mt-6 border-2 border-black bg-[#F2F2F2] p-6">
                <MarkdownContent>{report.markdown}</MarkdownContent>
              </div>
            )}

            {/* Sections */}
            <div className="mt-8 border-t-2 border-black pt-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                Sections
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.sections.map((section) => (
                  <span
                    key={section}
                    className="inline-block border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-black"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-0 text-xs font-bold uppercase tracking-widest text-black">
          <a href="/" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            ← Home
          </a>
          <a href="/archive" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            Archive
          </a>
          <a href="/bookmarks" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            My Bookmarks
          </a>
          <a href="/university" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            University
          </a>
          <a href="/dictionary" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            Dictionary
          </a>
        </div>
      </div>
    </div>
  );
}
