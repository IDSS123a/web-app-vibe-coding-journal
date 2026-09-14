import { notFound } from "next/navigation";
import { getPublishedReportByDate, getArticlesForReport } from "@/features/archive/repository";
import { getRelatedSourcesForArticles } from "@/features/pipeline/repository";
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
  // Phase 4 (specs/vibe-coding-intelligence-engine/ROADMAP.md): which
  // other sources covered the same event as each of these articles.
  const relatedSourcesMap =
    articles.length > 0
      ? await getRelatedSourcesForArticles(articles.map((a) => a.id))
      : new Map<string, string[]>();
  const relatedSources = Object.fromEntries(relatedSourcesMap);

  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <a
            href="/archive"
            className="text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
          >
            ← Archive
          </a>
        </div>

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
            <ArticleListWithBookmarks articles={articles} relatedSources={relatedSources} />
          ) : (
            <div className="swiss-grid-pattern mt-6 whitespace-pre-wrap border-2 border-black bg-[#F2F2F2] p-6 font-mono text-sm text-black">
              {report.markdown}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
