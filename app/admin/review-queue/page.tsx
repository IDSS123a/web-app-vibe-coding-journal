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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading reports...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You must be signed in as an admin to view the review queue.
        </p>
        <a href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
          Sign in →
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        {actionMsg && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-sm">
            {actionMsg}
          </div>
        )}
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No held reports at this time.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {actionMsg && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-sm">
          {actionMsg}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Held for Review ({total})
        </h2>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Articles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {reports.map((report) => {
              const isPreP0 = report.date < P0_SHIP_DATE;
              const isAbnormalCount = report.article_count > ABNORMAL_ARTICLE_COUNT;
              const isRisky = isPreP0 || isAbnormalCount;
              return (
                <tr
                  key={report.date}
                  className={
                    isRisky
                      ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  }
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-50">
                    {report.date}
                    {isPreP0 && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-900 dark:bg-red-900 dark:text-red-100">
                        ⚠ PRE-P-0, UNVERIFIED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {report.article_count}
                    {isAbnormalCount && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-900 dark:bg-red-900 dark:text-red-100">
                        ⚠ ABNORMAL COUNT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                      {report.review_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/review-queue/${report.date}`}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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
          className="px-4 py-2 text-sm font-medium rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-sm">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="px-4 py-2 text-sm font-medium rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
