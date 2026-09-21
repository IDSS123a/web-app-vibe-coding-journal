/**
 * The Daily Report's dated header (KANON Edition layer, PDL-074): the weekday and year as a label, the day and
 * month as the large Unbounded date, and the article count, reading time and update time as mono metadata.
 * Shared by the dashboard and the archive so the two never drift apart. Dates are shown in UTC, the same
 * calendar day the report is filed under, so the weekday and the day colour always agree.
 */
import type { DailyReport } from "@/lib/validation/schemas";
import { formatPublicTimestamp } from "@/lib/time/format-public-timestamp";

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** The report's weekday key, which selects the day colour (`data-day` in app/kanon.css). */
export function dayKeyOf(reportDate: string): (typeof DAY_KEYS)[number] {
  return DAY_KEYS[new Date(reportDate).getUTCDay()] ?? "mon";
}

export function ReportHeader({ report, status }: { report: DailyReport; status?: string | null }) {
  const d = new Date(report.date);
  const fmt = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { ...o, timeZone: "UTC" });
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-6">
      <div>
        <p className="k-label">
          {fmt({ weekday: "long" })}
          {" · "}
          {fmt({ year: "numeric" })}
        </p>
        <p className="k-date-report mt-3">{fmt({ month: "long", day: "numeric" })}</p>
        <p className="k-meta mt-4">
          {report.article_count} articles • {report.reading_time_minutes || "< 1"} min read
        </p>
        <p className="k-meta mt-1">Updated {formatPublicTimestamp(report.updated_at)}</p>
      </div>
      {status && (
        <div className="text-right">
          <span className="k-badge k-badge-day">{status}</span>
        </div>
      )}
    </div>
  );
}
