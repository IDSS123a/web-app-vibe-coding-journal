import type { Article, DailyReport } from "@/lib/validation/schemas";
import { formatPublicTimestamp } from "@/lib/time/format-public-timestamp";
import {
  getTodaysDailyReport,
  getMostRecentPublishedDailyReport,
} from "@/features/daily-report/repository";
import { getArticlesForReport } from "@/features/archive/repository";
import { getRelatedSourcesForArticles } from "@/features/pipeline/repository";
import { ArticleListWithBookmarks } from "@/components/ArticleListWithBookmarks";

/**
 * Dashboard — real Daily Report page.
 *
 * Originally shipped in Sprint 1 as a hardcoded seed/placeholder to prove
 * the Presentation layer rendered the DailyReport schema correctly, with
 * "real pipeline comes Sprint 2+" as an explicit TODO. That pipeline was
 * built (Sprints 2-6) but this page was never reconnected to it -- found
 * 2026-09-10 while investigating why the public site always showed empty
 * content: the page genuinely never queried the database at all.
 *
 * P-6: only auto_published/manually_approved reports are ever shown here
 * -- held_for_review and rejected must never reach a real visitor, which
 * is the entire point of the review gate.
 */

const EMPTY_STATE_REPORT: DailyReport = {
  id: "empty-state",
  date: new Date().toISOString().split("T")[0]!,
  markdown: `
# Najvažnije
*No articles today — check back tomorrow.*

## Trendovi
*No trending topics at this time.*

## Novi alati
*Awaiting new tool releases.*

## Research
*No research papers today.*

## GitHub
*No GitHub updates at this time.*

## Šta testirati danas
*Explore yesterday's report or check back tomorrow for new recommendations.*
`.trim(),
  reading_time_minutes: 0,
  article_count: 0,
  sections: ["Najvažnije", "Trendovi", "Novi alati", "Research", "GitHub", "Šta testirati danas"],
  review_status: "auto_published",
  approved_by: null,
  approved_at: null,
  rejected_by: null,
  rejected_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Without this, Next.js can statically pre-render this page at BUILD
// time and serve that same stale snapshot to every visitor until the
// next deploy -- the entire point of this page is showing today's real,
// currently-published report, which changes daily without a redeploy.
export const dynamic = "force-dynamic";

async function getDisplayReport(): Promise<{ report: DailyReport; isEmptyState: boolean }> {
  const todays = await getTodaysDailyReport();
  if (todays && (todays.review_status === "auto_published" || todays.review_status === "manually_approved")) {
    return { report: todays, isEmptyState: false };
  }

  // Today's report doesn't exist yet, or hasn't cleared review -- fall
  // back to the last report that actually did, per the empty-state
  // copy's own promise ("check yesterday's report").
  const lastPublished = await getMostRecentPublishedDailyReport();
  if (lastPublished) {
    return { report: lastPublished, isEmptyState: false };
  }

  return { report: EMPTY_STATE_REPORT, isEmptyState: true };
}

export default async function DashboardPage() {
  const { report, isEmptyState } = await getDisplayReport();
  // Sprint 10: individually-listed, bookmarkable articles -- empty for
  // the empty-state placeholder and for any report generated before
  // migration 009 shipped (see that migration's comment); the raw
  // markdown below still renders either way, so nothing is lost.
  const articles: Article[] = isEmptyState ? [] : await getArticlesForReport(report.id);
  // Phase 4 (specs/vibe-coding-intelligence-engine/ROADMAP.md): which
  // other sources covered the same event as each of these articles.
  const relatedSourcesMap =
    articles.length > 0
      ? await getRelatedSourcesForArticles(articles.map((a) => a.id))
      : new Map<string, string[]>();
  const relatedSources = Object.fromEntries(relatedSourcesMap);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Vibe-Coding Journal</h1>
          <p className="text-gray-600">Automated daily intelligence digest for vibe-coders</p>
        </div>

        {/* Daily Report Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {/* Meta info */}
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <p className="text-sm text-gray-600">
                {new Date(report.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-500">
                {report.article_count} articles •{" "}
                {report.reading_time_minutes || "< 1"} min read
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Updated {formatPublicTimestamp(report.updated_at)}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {report.review_status === "auto_published" && "Auto-published"}
                {report.review_status === "manually_approved" && "Approved"}
              </span>
            </div>
          </div>

          {/* Content */}
          {isEmptyState && (
            <div className="prose prose-sm max-w-none">
              <p className="text-center italic text-gray-500">
                No Daily Report is available right now — check back soon.
              </p>
            </div>
          )}

          {/* Sprint 10: structured, bookmarkable article list when available
              (migration 009); raw markdown as the fallback for reports
              generated before that shipped, or if linking ever fails. */}
          {articles.length > 0 ? (
            <ArticleListWithBookmarks articles={articles} relatedSources={relatedSources} />
          ) : (
            <div className="mt-6 whitespace-pre-wrap rounded bg-gray-100 p-4 font-mono text-sm text-gray-700">
              {report.markdown}
            </div>
          )}

          {/* Sections */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="mb-3 font-semibold">Sections</h3>
            <div className="flex flex-wrap gap-2">
              {report.sections.map((section) => (
                <span
                  key={section}
                  className="inline-block rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-4 text-sm text-gray-600">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← Home
          </a>
          <a href="/archive" className="text-blue-600 hover:text-blue-800">
            Archive
          </a>
          <a href="/bookmarks" className="text-blue-600 hover:text-blue-800">
            My Bookmarks
          </a>
        </div>
      </div>
    </div>
  );
}
