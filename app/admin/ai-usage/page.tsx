/**
 * Admin: AI usage today (2026-09-22). The free AI pool is shared by everything (the Daily Report, the Assistant, the Prompt School
 * sandbox), so the admin sees how much of the Assistant's and the sandbox's daily share is used, and by whom. This is the
 * usage and quota visibility the Assistant's spec required (P-19); until now only the API existed.
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";

interface Usage {
  total: number;
  capGlobal: number;
  perUser: Array<{ userId: string; count: number }>;
  sandbox: { total: number; cap: number };
}

export default function AdminAiUsagePage() {
  const { token, loading: sessionLoading } = useSession();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    const headers = { authorization: `Bearer ${token}` };
    fetch("/api/admin/assistant-usage", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { data: { today: Usage } }) => {
        if (active) setUsage(d.data.today);
      })
      .catch(() => {
        if (active) setError("Failed to load AI usage.");
      });
    // The usage answer names people by id; the users list gives their addresses.
    fetch("/api/admin/users", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { data: Array<{ id: string; email: string }> }) => {
        if (active) setEmails(Object.fromEntries(d.data.map((u) => [u.id, u.email])));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, sessionLoading]);

  const bar = (used: number, cap: number) => (
    <div className="mt-2 h-2 w-full bg-console-panel-2" role="progressbar" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={used}>
      <div className={`h-2 ${used >= cap ? "bg-signal" : "bg-console-ice"}`} style={{ width: `${Math.min(100, (used / Math.max(1, cap)) * 100)}%` }} />
    </div>
  );

  return (
    <div>
      <div className="mb-8 border-b border-console-line pb-6">
        <p className="mb-2 text-signal k-label">Capacity</p>
        <h2 className="text-console-text k-h2">AI usage today</h2>
        <p className="mt-2 text-sm text-console-text">
          The free AI pool is shared by the Daily Report, the Assistant and the Prompt School sandbox. These are the daily shares of the two
          features learners use, counted from midnight UTC.
        </p>
      </div>

      {error && <p className="border border-signal p-3 text-sm text-signal">{error}</p>}
      {!usage && !error && <p className="text-sm text-console-text opacity-60">Loading…</p>}

      {usage && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="border border-console-line p-5">
            <p className="k-label text-console-text">Assistant</p>
            <p className="mt-1 text-console-text k-h3">
              {usage.total} of {usage.capGlobal}
            </p>
            {bar(usage.total, usage.capGlobal)}
            <p className="mt-2 text-xs text-console-dim">Prompts generated today, all learners. At the limit the Assistant answers that it is at capacity.</p>
          </section>
          <section className="border border-console-line p-5">
            <p className="k-label text-console-text">Prompt School sandbox</p>
            <p className="mt-1 text-console-text k-h3">
              {usage.sandbox.total} of {usage.sandbox.cap}
            </p>
            {bar(usage.sandbox.total, usage.sandbox.cap)}
            <p className="mt-2 text-xs text-console-dim">Live runs today, all learners (3 per learner). No text is stored, only the count.</p>
          </section>

          <section className="border border-console-line p-5 md:col-span-2">
            <p className="mb-3 k-label text-console-text">Assistant, by learner today</p>
            {usage.perUser.length === 0 ? (
              <p className="text-sm text-console-dim">Nobody has used the Assistant today.</p>
            ) : (
              <ul className="divide-y divide-console-line text-sm text-console-text">
                {usage.perUser.map((u) => (
                  <li key={u.userId} className="flex items-center justify-between py-2">
                    <span className="break-all">{emails[u.userId] ?? u.userId}</span>
                    <span className="font-mono">{u.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
