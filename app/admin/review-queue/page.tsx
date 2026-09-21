/**
 * Admin: Review Queue
 * List all held_for_review reports
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import type { DailyReport } from "@/lib/validation/schemas";

// Found live 2026-09-15 (DECISION_LOG.md): the Director approved a
// pre-P-0 report (2026-09-03, 854 articles, almost entirely off-topic)
// from this exact queue, because nothing here distinguished it from a
// normal, small, post-P-0 report in the list. P-0 (the topical-
// relevance gate) shipped 2026-09-11 -- any report dated before that
// was never checked against it (DECISION_LOG.md PDL-026's own
// consequence note). A normal report is 5-20 articles; anything in the
// hundreds is itself a red flag independent of date, since it almost
// certainly predates the unbounded-growth fix (2026-09-10) too.
const P0_SHIP_DATE = "2026-09-11";
const ABNORMAL_ARTICLE_COUNT = 100;

export default function ReviewQueuePage() {
  const { token, loading: sessionLoading } = useSession();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const pageSize = 10;

  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get("action");
    if (action === "approved") setActionMsg("Report approved and published.");
    if (action === "rejected") setActionMsg("Report rejected.");
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    fetchReports();
    // fetchReports is re-created every render and only reads page and token, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token, sessionLoading]);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);

      const offset = page * pageSize;
      const response = await fetch(
        `/api/admin/reports?status=held_for_review&limit=${pageSize}&offset=${offset}`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.reports);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <div className="text-console-dim">Loading reports...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-12">
        <p className="text-console-dim mb-4">
          You must be signed in as an admin to view the review queue.
        </p>
        <Link href="/login" className="text-console-ice hover:text-signal font-semibold">
          Sign in →
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-console-panel-2 border border-signal p-4">
        <p className="text-signal">Error: {error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        {actionMsg && (
          <div className="p-3 bg-console-panel-2 border border-console-line text-console-ice text-sm">
            {actionMsg}
          </div>
        )}
        <div className="text-center py-12">
          <p className="text-console-dim">No held reports at this time.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {actionMsg && (
        <div className="p-3 bg-console-panel-2 border border-console-line text-console-ice text-sm">
          {actionMsg}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-console-text k-h4">
          Held for Review ({total})
        </h2>
      </div>

      {/* Reports Table */}
      <div className="bg-console-panel border border-console-line overflow-x-auto">
        <table className="min-w-full divide-y divide-console-line">
          <thead className="bg-console-panel">
            <tr>
              <th className="px-6 py-3 text-left text-console-dim k-label">
                Date
              </th>
              <th className="px-6 py-3 text-left text-console-dim k-label">
                Articles
              </th>
              <th className="px-6 py-3 text-left text-console-dim k-label">
                Status
              </th>
              <th className="px-6 py-3 text-left text-console-dim k-label">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-console-line">
            {reports.map((report) => {
              const isPreP0 = report.date < P0_SHIP_DATE;
              const isAbnormalCount = report.article_count > ABNORMAL_ARTICLE_COUNT;
              const isRisky = isPreP0 || isAbnormalCount;
              return (
                <tr
                  key={report.date}
                  className={
                    isRisky
                      ? "bg-console-panel-2 hover:bg-console-line"
                      : "hover:bg-console-panel-2"
                  }
                >
                  <td className="px-6 py-4 text-sm font-medium text-console-text">
                    {report.date}
                    {isPreP0 && (
                      <span className="ml-2 inline-flex items-center bg-console-panel-2 px-2 py-0.5 text-xs font-bold text-signal">
                        ⚠ PRE-P-0, UNVERIFIED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-console-dim">
                    {report.article_count}
                    {isAbnormalCount && (
                      <span className="ml-2 inline-flex items-center bg-console-panel-2 px-2 py-0.5 text-xs font-bold text-signal">
                        ⚠ ABNORMAL COUNT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-transparent border border-console-amber text-console-amber">
                      {report.review_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/review-queue/${report.date}`}
                      className="inline-flex min-h-11 items-center text-console-ice hover:text-signal"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="min-h-11 px-4 py-2 text-sm font-medium border border-console-line disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-sm">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="min-h-11 px-4 py-2 text-sm font-medium border border-console-line disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
