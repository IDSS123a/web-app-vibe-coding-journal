/**
 * Admin: Review Report Details
 * Review articles and approve/reject report
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import type { DailyReport, Article } from "@/lib/validation/schemas";

// Found live 2026-09-15 (DECISION_LOG.md): the Director approved a
// pre-P-0 report (2026-09-03, 854 articles, almost entirely off-topic)
// from this exact page. Same warning as the list page
// (app/admin/review-queue/page.tsx), repeated here right next to the
// actual Approve button -- the list page's badge only helps avoid
// opening a risky report, not clicking Approve once already inside it.
const P0_SHIP_DATE = "2026-09-11";
const ABNORMAL_ARTICLE_COUNT = 100;

export default function ReviewDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const router = useRouter();
  const { token, loading: sessionLoading } = useSession();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    params.then(({ date: d }) => {
      setDate(d);
      fetchReportDetails(d);
    });
    // fetchReportDetails is re-created every render and only reads token and the date argument.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, token, sessionLoading]);

  async function fetchReportDetails(dateStr: string) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/reports/${dateStr}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.status}`);
      }

      const data = await response.json();
      setReport(data.report);
      setArticles(data.articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!report || !date) return;
    if (isRisky) {
      const confirmed = window.confirm(
        `This report is flagged as risky:\n${riskyReasons.join("\n")}\n\nApprove anyway? This will make it publicly visible.`,
      );
      if (!confirmed) return;
    }
    try {
      setApproving(true);
      const response = await fetch(`/api/admin/reports/${date}/approve`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve: ${response.status}`);
      }

      router.push("/admin/review-queue?action=approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!report || !date) return;
    try {
      setRejecting(true);
      const response = await fetch(`/api/admin/reports/${date}/reject`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject: ${response.status}`);
      }

      router.push("/admin/review-queue?action=rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRejecting(false);
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <div className="text-gray-600 dark:text-gray-400">Loading report...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You must be signed in as an admin to review reports.
        </p>
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
          Sign in →
        </Link>
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

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Report not found.</p>
      </div>
    );
  }

  const riskyReasons: string[] = [];
  if (date && date < P0_SHIP_DATE) {
    riskyReasons.push("Dated before the P-0 relevance gate shipped (2026-09-11), never checked for topical relevance.");
  }
  if (report.article_count > ABNORMAL_ARTICLE_COUNT) {
    riskyReasons.push(`Abnormally large (${report.article_count} articles), a normal report is 5-20.`);
  }
  const isRisky = riskyReasons.length > 0;

  return (
    <div className="space-y-6">
      {isRisky && (
        <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/40">
          <p className="mb-1 font-bold text-red-900 dark:text-red-100">⚠ This report is flagged as risky</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-800 dark:text-red-200">
            {riskyReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{date}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {report.article_count} articles • {report.review_status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approving ? "Approving..." : "Approve"}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={rejecting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rejecting ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-50">Status</h3>
          <p className="text-gray-600 dark:text-gray-400">{report.review_status}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-50">Reading Time</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {report.reading_time_minutes} minutes
          </p>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Articles</h3>
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
            >
              <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                {article.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {article.summary || article.raw_summary || "No summary"}
              </p>
              <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500">
                <span>Source: {article.source || "Unknown"}</span>
                <span>Category: {article.category || "Uncategorized"}</span>
                <span>Confidence: {article.confidence_score?.toFixed(2) || "N/A"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-950 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Report</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
