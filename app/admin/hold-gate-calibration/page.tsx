/**
 * Admin: Hold-Gate Calibration
 * specs/hold-gate-calibration-learning/ -- the Director's continuous-
 * learning idea, Phase 1, scoped to the P-3/P-6 hold gate. Shows the
 * latest run, lets the admin trigger one on demand, and lists pending
 * suggestions for explicit apply/dismiss (the system never applies a
 * change on its own authority -- SPEC.md acceptance criterion).
 */

"use client";

import Link from "next/link";
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
  completed: "border border-console-ice text-console-ice",
  running: "border border-console-amber text-console-amber",
  failed: "border border-signal text-signal",
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
        <div className="text-console-dim">Loading…</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-console-dim">
          You must be signed in as an admin to view this page.
        </p>
        <Link href="/login" className="font-semibold text-console-ice hover:text-signal">
          Sign in →
        </Link>
      </div>
    );
  }

  const latest = data?.latestRun ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-console-text k-h4">
          Hold-Gate Calibration
        </h2>
        <button
          onClick={triggerRun}
          disabled={running || latest?.status === "running"}
          className="min-h-11 bg-console-panel-2 px-4 py-2 text-sm font-medium text-console-text hover:bg-console-panel-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running || latest?.status === "running" ? "Running…" : "Re-run now"}
        </button>
      </div>

      {error && (
        <div className="border border-signal bg-console-panel-2 p-4 text-signal">
          {error}
        </div>
      )}

      {/* Latest run summary */}
      <div className="border border-console-line bg-console-panel p-5">
        <h3 className="mb-3 text-console-text k-h4">Latest run</h3>
        {!latest ? (
          <p className="text-sm text-console-dim">No runs yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[latest.status] ?? ""}`}
              >
                {latest.status}
              </span>
              <span className="text-console-dim">
                {latest.triggered_by} · {new Date(latest.created_at).toLocaleString()}
              </span>
            </div>
            {latest.reports_analyzed_count !== null && (
              <p className="text-console-text">
                Reports analyzed: {latest.reports_analyzed_count}
              </p>
            )}
            {latest.error_message && (
              <p className="text-signal">Error: {latest.error_message}</p>
            )}
            {latest.summary_markdown && (
              <div className="mt-2 bg-console-panel p-3 text-xs text-console-text">
                <MarkdownContent>{latest.summary_markdown}</MarkdownContent>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending suggestions */}
      <div className="border border-console-line bg-console-panel p-5">
        <h3 className="mb-3 text-console-text k-h4">
          Pending suggestions ({data?.pendingSuggestions.length ?? 0})
        </h3>
        {!data || data.pendingSuggestions.length === 0 ? (
          <p className="text-sm text-console-dim">No pending suggestions.</p>
        ) : (
          <div className="space-y-4">
            {data.pendingSuggestions.map((s) => (
              <div key={s.id} className="border border-console-line p-4">
                <p className="font-medium text-console-text">{s.suggestion_text}</p>
                <p className="mt-1 text-sm text-console-dim">{s.rationale}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => actOnSuggestion(s.id, "applied")}
                    disabled={actioningId === s.id}
                    className="bg-console-panel-2 px-3 py-1.5 text-sm font-medium text-console-text hover:bg-console-panel-2 disabled:opacity-50"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => actOnSuggestion(s.id, "dismissed")}
                    disabled={actioningId === s.id}
                    className="bg-console-panel px-3 py-1.5 text-sm font-medium text-console-text hover:bg-console-panel-2 disabled:opacity-50"
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
      <div className="overflow-x-auto border border-console-line bg-console-panel p-5">
        <h3 className="mb-3 text-console-text k-h4">Run history</h3>
        {!data || data.runHistory.length === 0 ? (
          <p className="text-sm text-console-dim">No runs yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-console-line text-sm">
            <thead>
              <tr className="text-left text-console-dim k-label">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Trigger</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-line">
              {data.runHistory.map((run) => (
                <tr key={run.id}>
                  <td className="py-2 pr-4 text-console-text">
                    {new Date(run.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-console-text">{run.triggered_by}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[run.status] ?? ""}`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-console-text">
                    {run.reports_analyzed_count ?? "n/a"}
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
