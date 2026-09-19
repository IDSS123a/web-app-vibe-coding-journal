"use client";

import { useParams } from "next/navigation";
import type { Article, DailyReport } from "@/lib/validation/schemas";
import { formatPublicTimestamp } from "@/lib/time/format-public-timestamp";
import { useAuthedJson } from "@/lib/auth/use-authed-json";
import { ArticleListWithBookmarks } from "@/components/ArticleListWithBookmarks";
import { MarkdownContent } from "@/components/MarkdownContent";

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
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <a
            href="/archive"
            className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
          >
            ← Archive
          </a>
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {status === 404 && (
          <p className="border-4 border-black py-16 text-center text-sm italic text-black opacity-60">
            This report does not exist.
          </p>
        )}
        {error && status !== 404 && (
          <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>
        )}

        {report && (
          <div className="border-4 border-black p-8 md:p-12">
            <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-6">
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
            </div>

            {articles.length > 0 ? (
              <ArticleListWithBookmarks articles={articles} relatedSources={data?.relatedSources ?? {}} />
            ) : (
              <div className="swiss-grid-pattern mt-6 border-2 border-black bg-[#F2F2F2] p-6">
                <MarkdownContent>{report.markdown}</MarkdownContent>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
