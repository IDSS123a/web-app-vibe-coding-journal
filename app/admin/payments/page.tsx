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

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    fetch("/api/admin/payments?limit=50", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { events: PaymentEventRow[] }) => {
        if (active) setEvents(d.events);
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
      <div className="mb-8 border-b-4 border-black pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Revenue</p>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Payments</h2>
        <p className="mt-2 text-sm text-black">
          Every PayPal webhook event, newest first. Subscriptions activate automatically, this
          list is for visibility, not approval.
        </p>
      </div>

      {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
      {error && <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="border-4 border-black py-16 text-center text-sm italic text-black opacity-60">
          No payment events yet.
        </p>
      )}

      {events.length > 0 && (
        <div className="overflow-x-auto border-black md:border-4">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black text-xs font-bold uppercase tracking-widest text-black">
                <th className="p-4">When</th>
                <th className="p-4">User</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b-2 border-black last:border-b-0">
                  <td className="p-4 text-black">
                    {new Date(event.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4 text-black">{event.user_email ?? event.user_id ?? "n/a"}</td>
                  <td className="p-4 text-black">{event.tier ?? "n/a"}</td>
                  <td className="p-4 text-black">
                    {event.amount_usd != null ? `$${event.amount_usd}` : "n/a"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${
                        event.status === "processed"
                          ? "border-black text-black"
                          : event.status === "ambiguous"
                            ? "border-[#FF3000] text-[#FF3000]"
                            : "border-black text-black opacity-50"
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
