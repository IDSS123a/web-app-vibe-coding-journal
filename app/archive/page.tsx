import { getPublishedReportsPage } from "@/features/archive/repository";

/**
 * Archive — paginated list of past Daily Reports (Sprint 10).
 * P-6: getPublishedReportsPage() already filters to
 * auto_published/manually_approved only -- never held_for_review or
 * rejected, same rule as /dashboard.
 * Public, same access level as /dashboard today (see HANDOFF note on
 * the P-13 paywall not actually being enforced on either page).
 */
export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, parseInt(pageParam ?? "0", 10) || 0);
  const { reports, hasMore } = await getPublishedReportsPage(page);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-50">Archive</h1>
          <p className="text-gray-600 dark:text-gray-400">Past Daily Reports</p>
        </div>

        {reports.length === 0 ? (
          <p className="text-center italic text-gray-500">No past reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <a
                key={report.id}
                href={`/archive/${report.date}`}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    {new Date(report.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {report.article_count} articles · {report.reading_time_minutes || "< 1"} min read
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between text-sm">
          {page > 0 ? (
            <a href={`/archive?page=${page - 1}`} className="text-blue-600 hover:text-blue-800">
              ← Newer
            </a>
          ) : (
            <span />
          )}
          {hasMore && (
            <a href={`/archive?page=${page + 1}`} className="text-blue-600 hover:text-blue-800">
              Older →
            </a>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4 text-sm text-gray-600">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Dashboard
          </a>
          <a href="/bookmarks" className="text-blue-600 hover:text-blue-800">
            My Bookmarks
          </a>
        </div>
      </div>
    </div>
  );
}
