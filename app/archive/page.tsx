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
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
            Record
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Archive</h1>
          <p className="mt-2 text-sm text-black">Past Daily Reports</p>
        </div>

        {reports.length === 0 ? (
          <p className="border-4 border-black py-16 text-center text-sm italic text-black opacity-60">
            No past reports yet.
          </p>
        ) : (
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
            <a href={`/archive?page=${page - 1}`} className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
              ← Newer
            </a>
          ) : (
            <span />
          )}
          {hasMore && (
            <a href={`/archive?page=${page + 1}`} className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
              Older →
            </a>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-6 text-xs font-bold uppercase tracking-widest text-black">
          <a href="/dashboard" className="underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            ← Dashboard
          </a>
          <a href="/bookmarks" className="underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            My Bookmarks
          </a>
        </div>
      </div>
    </div>
  );
}
