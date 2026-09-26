"use client";

/**
 * The trial entry point on the Dashboard (PDL-079). A new account has a free trial with Premium access, and until now the only way
 * to buy was after the trial had ended. This shows the days left and both plans with the same PayPal button, so someone who is
 * convinced does not have to wait. Like every purchase screen it never trusts the client-side approval: it polls /api/me until the
 * server says the plan is active.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { fetchMe } from "@/lib/auth/fetch-me";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { PaymentAssurance } from "@/components/PaymentAssurance";
import { BASIC_PRICE_USD, PREMIUM_PRICE_USD } from "@/lib/pricing";

interface Me {
  hasAccess: boolean;
  isAdmin?: boolean;
  subscriptionStatus?: "trial" | "active" | "expired" | null;
  trialEndsAt?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function TrialBanner() {
  const { token, loading } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetchMe(token)
      .then((d: Me) => {
        if (active) setMe(d);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, loading]);

  useEffect(() => {
    if (!awaiting || !token) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      fetchMe(token)
        .then((d: Me) => {
          if (d.subscriptionStatus === "active") {
            setDone(true);
            setAwaiting(false);
            clearInterval(interval);
          } else if (attempts >= 8) {
            clearInterval(interval);
          }
        })
        .catch(() => {
          if (attempts >= 8) clearInterval(interval);
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [awaiting, token]);

  const ends = me?.trialEndsAt ? new Date(me.trialEndsAt) : null;
  if (!me || me.isAdmin || me.subscriptionStatus !== "trial" || !me.hasAccess || !ends) return null;
  const daysLeft = Math.max(1, Math.ceil((ends.getTime() - Date.now()) / DAY_MS));

  if (done) {
    return (
      <section role="status" className="mb-8 border border-black p-5 text-sm text-black sm:p-6">
        Thank you. Your plan is active.
      </section>
    );
  }

  return (
    <section className="mb-8 border border-signal p-5 sm:p-6">
      <p className="mb-1 text-signal k-label">Free trial</p>
      <h3 className="mb-2 text-black k-h4">
        {daysLeft} {daysLeft === 1 ? "day" : "days"} left. Keep everything for a year.
      </h3>
      <p className="mb-5 text-sm leading-relaxed text-black">
        One payment, 12 months, no automatic renewal. Your progress and coins stay with you.
      </p>
      {awaiting ? (
        <p role="status" className="border border-black p-3 text-sm text-black">
          Processing your payment…
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="border border-black p-4">
            <p className="text-black k-label">Basic, ${BASIC_PRICE_USD} a year</p>
            <p className="mb-3 text-sm text-black">Daily Report, Archive, Bookmarks.</p>
            {token && <PayPalCheckout checkout={{ kind: "tier", tier: "basic" }} token={token} onApproved={() => setAwaiting(true)} />}
          </div>
          <div className="border border-signal p-4">
            <p className="text-signal k-label">Premium, ${PREMIUM_PRICE_USD} a year</p>
            <p className="mb-3 text-sm text-black">Everything in Basic, plus University, Dictionary, Assistant and Prompt School.</p>
            {token && <PayPalCheckout checkout={{ kind: "tier", tier: "premium" }} token={token} onApproved={() => setAwaiting(true)} />}
          </div>
        </div>
      )}
      <ul className="mt-4 space-y-1 text-xs text-black/80">
        <PaymentAssurance variant="items" />
      </ul>
    </section>
  );
}
