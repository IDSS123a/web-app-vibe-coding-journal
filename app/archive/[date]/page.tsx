"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { Article, DailyReport } from "@/lib/validation/schemas";
import { useAuthedJson } from "@/lib/auth/use-authed-json";
import { ArticleListWithBookmarks } from "@/components/ArticleListWithBookmarks";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ReportHeader, dayKeyOf } from "@/components/ReportHeader";

/**
 * A single historical Daily Report (Sprint 10). P-6: GET /api/reports/[date]
 * answers 404 for a held or rejected report, same as for a missing one.
 * Paid content (2026-09-19): rendered client-side from the server-side-
 * paywalled API — nothing about the report is in the page source for an
 * unpaid or anonymous visitor (see features/daily-report/access.ts).
 */

interface ReportPayload {
  report: DailyReport;
  articles: Article[];
  relatedSources: Record<string, string[]>;
}

export default function ArchiveDatePage() {
  const params = useParams<{ date: string }>();
  const { data, loading, status, error } = useAuthedJson<ReportPayload>(`/api/reports/${params.date}`);
  const report = data?.report ?? null;
  const articles = data?.articles ?? [];

  return (
    <div className="k-page layer-edition">
      <div className="k-wide">
        <div className="mb-8">
          <Link
            href="/archive"
            className="k-btn"
          >
            ← Archive
          </Link>
        </div>

        {loading && <p className="k-ui text-ink-soft">Loading…</p>}
        {status === 404 && (
          <p className="k-box k-ui py-16 text-center text-ink-soft">
            This report does not exist.
          </p>
        )}
        {error && status !== 404 && (
          <p className="border border-signal p-3 text-sm text-signal">{error}</p>
        )}

        {report && (
          <div data-day={dayKeyOf(report.date)} className="k-box k-daybar p-8 md:p-12">
            <ReportHeader report={report} />

            {articles.length > 0 ? (
              <ArticleListWithBookmarks articles={articles} relatedSources={data?.relatedSources ?? {}} />
            ) : (
              <div className="k-box-muted swiss-grid-pattern mt-6 p-6">
                <MarkdownContent className="k-cols">{report.markdown}</MarkdownContent>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
