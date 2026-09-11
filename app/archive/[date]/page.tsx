import { notFound } from "next/navigation";
import { getPublishedReportByDate, getArticlesForReport } from "@/features/archive/repository";
import { formatPublicTimestamp } from "@/lib/time/format-public-timestamp";
import { ArticleListWithBookmarks } from "@/components/ArticleListWithBookmarks";

/**
 * A single historical Daily Report (Sprint 10). P-6: 404s rather than
 * ever rendering a held/rejected report -- getPublishedReportByDate()
 * applies the same status filter as the /archive list and /dashboard.
 */
export const dynamic = "force-dynamic";

export default async function ArchiveDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const report = await getPublishedReportByDate(date);
  if (!report) {
    notFound();
  }

  const articles = await getArticlesForReport(report.id);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <a href="/archive" className="text-sm text-blue-600 hover:text-blue-800">
            ← Archive
          </a>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(report.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {report.article_count} articles • {report.reading_time_minutes || "< 1"} min read
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">
                Updated {formatPublicTimestamp(report.updated_at)}
              </p>
            </div>
          </div>

          {articles.length > 0 ? (
            <ArticleListWithBookmarks articles={articles} />
          ) : (
            <div className="mt-6 whitespace-pre-wrap rounded bg-gray-100 p-4 font-mono text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {report.markdown}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
