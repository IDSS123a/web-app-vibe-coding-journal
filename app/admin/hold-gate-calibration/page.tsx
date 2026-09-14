/**
 * Admin: Hold-Gate Calibration
 * specs/hold-gate-calibration-learning/ -- the Director's continuous-
 * learning idea, Phase 1, scoped to the P-3/P-6 hold gate. Shows the
 * latest run, lets the admin trigger one on demand, and lists pending
 * suggestions for explicit apply/dismiss (the system never applies a
 * change on its own authority -- SPEC.md acceptance criterion).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { MarkdownContent } from "@/components/MarkdownContent";
import type {
  HoldGateCalibrationRun,
  HoldGateCalibrationSuggestion,
} from "@/lib/validation/schemas";

interface PageData {
  latestRun: HoldGateCalibrationRun | null;
  runHistory: HoldGateCalibrationRun[];
  pendingSuggestions: HoldGateCalibrationSuggestion[];
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  running: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
};

export default function HoldGateCalibrationPage() {
  const { token, loading: sessionLoading } = useSession();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch("/api/admin/hold-gate-calibration", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch: HTTP ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [token, sessionLoading, fetchData]);

  async function triggerRun() {
    if (!token) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hold-gate-calibration/run", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.status === 409) {
        setError("A run is already in progress.");
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function actOnSuggestion(id: string, status: "applied" | "dismissed") {
    if (!token) return;
    setActioningId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hold-gate-calibration/suggestions/${id}`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActioningId(null);
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          You must be signed in as an admin to view this page.
        </p>
        <a href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
          Sign in →
        </a>
      </div>
    );
  }

  const latest = data?.latestRun ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Hold-Gate Calibration
        </h2>
        <button
          onClick={triggerRun}
          disabled={running || latest?.status === "running"}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running || latest?.status === "running" ? "Running…" : "Re-run now"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Latest run summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-50">Latest run</h3>
        {!latest ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No runs yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[latest.status] ?? ""}`}
              >
                {latest.status}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {latest.triggered_by} · {new Date(latest.created_at).toLocaleString()}
              </span>
            </div>
            {latest.reports_analyzed_count !== null && (
              <p className="text-gray-700 dark:text-gray-300">
                Reports analyzed: {latest.reports_analyzed_count}
              </p>
            )}
            {latest.error_message && (
              <p className="text-red-700 dark:text-red-300">Error: {latest.error_message}</p>
            )}
            {latest.summary_markdown && (
              <div className="mt-2 rounded bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <MarkdownContent>{latest.summary_markdown}</MarkdownContent>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending suggestions */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-50">
          Pending suggestions ({data?.pendingSuggestions.length ?? 0})
        </h3>
        {!data || data.pendingSuggestions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No pending suggestions.</p>
        ) : (
          <div className="space-y-4">
            {data.pendingSuggestions.map((s) => (
              <div key={s.id} className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
                <p className="font-medium text-gray-900 dark:text-gray-50">{s.suggestion_text}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.rationale}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => actOnSuggestion(s.id, "applied")}
                    disabled={actioningId === s.id}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => actOnSuggestion(s.id, "dismissed")}
                    disabled={actioningId === s.id}
                    className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run history */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-50">Run history</h3>
        {!data || data.runHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No runs yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Trigger</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.runHistory.map((run) => (
                <tr key={run.id}>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                    {new Date(run.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{run.triggered_by}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[run.status] ?? ""}`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                    {run.reports_analyzed_count ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
