/**
 * Admin: Payments — real-time visibility into every PayPal webhook
 * event (2026-09-14, Director's request). Subscription activation
 * stays fully automatic (webhook-driven, unchanged) — this page is
 * visibility, not an approval queue; confirmed explicitly with the
 * Director rather than assumed (DECISION_LOG.md, same day as PDL-030).
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import type { PaymentEvent } from "@/lib/validation/schemas";

type PaymentEventRow = PaymentEvent & { user_email: string | null };

const STATUS_LABEL: Record<PaymentEvent["status"], string> = {
  processed: "Activated",
  ambiguous: "Needs Review",
  ignored: "Ignored",
};

export default function AdminPaymentsPage() {
  const { token, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<PaymentEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"sandbox" | "live" | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    fetch("/api/admin/payments?limit=50", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { events: PaymentEventRow[]; paypalMode?: "sandbox" | "live" }) => {
        if (active) {
          setEvents(d.events);
          setMode(d.paypalMode ?? null);
        }
      })
      .catch(() => {
        if (active) setError("Failed to load payment events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, sessionLoading]);

  return (
    <div>
      <div className="mb-8 border-b border-console-line pb-6">
        <p className="mb-2 text-signal k-label">Revenue</p>
        <h2 className="text-console-text k-h2">Payments</h2>
        <p className="mt-2 text-sm text-console-text">
          Every PayPal webhook event, newest first. Subscriptions activate automatically, this
          list is for visibility, not approval.
        </p>
        {mode && (
          <p className="mt-3 text-sm text-console-text">
            PayPal mode:{" "}
            <strong className={mode === "live" ? "text-signal" : ""}>{mode === "live" ? "LIVE, real money" : "Sandbox, test money only"}</strong>
          </p>
        )}
      </div>

      {loading && <p className="text-sm text-console-text opacity-60">Loading…</p>}
      {error && <p className="border border-signal p-3 text-sm text-signal">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="border border-console-line py-16 text-center text-sm italic text-console-text opacity-60">
          No payment events yet.
        </p>
      )}

      {events.length > 0 && (
        <div className="overflow-x-auto border-console-line md:border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-console-line text-console-text k-label">
                <th className="p-4">When</th>
                <th className="p-4">User</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-console-line last:border-b-0">
                  <td className="p-4 text-console-text">
                    {new Date(event.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4 text-console-text">{event.user_email ?? event.user_id ?? "n/a"}</td>
                  <td className="p-4 text-console-text">{event.tier ?? "n/a"}</td>
                  <td className="p-4 text-console-text">
                    {event.amount_usd != null ? `$${event.amount_usd}` : "n/a"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`py-0.5 k-btn ${
                        event.status === "processed"
                          ? "border-console-line text-console-text"
                          : event.status === "ambiguous"
                            ? "border-signal text-signal"
                            : "border-console-line text-console-dim"
                      }`}
                    >
                      {STATUS_LABEL[event.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
