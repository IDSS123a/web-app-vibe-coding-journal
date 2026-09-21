"use client";

/**
 * The renewal entry point on the Dashboard (PDL-079). A paid plan lasts 12 months and does not renew by itself, so in its last
 * 7 days this offers the same plan again with the same PayPal button. The server allows an early renewal only in that window
 * and starts the new 12 months when the current year ends, so nothing already paid for is lost (features/payments/domain.ts).
 * Like every purchase screen it never trusts the client-side approval: it polls /api/me until the end date moves.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { BASIC_PRICE_USD, PREMIUM_PRICE_USD } from "@/lib/pricing";
import { RENEWAL_WINDOW_DAYS } from "@/features/payments/domain";

interface Me {
  hasAccess: boolean;
  subscriptionTier: "basic" | "premium" | null;
  subscriptionStatus?: "trial" | "active" | "expired" | null;
  subscriptionExpiresAt?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function RenewalBanner() {
  const { token, loading } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [renewed, setRenewed] = useState(false);

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: Me) => {
        if (active) setMe(d);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, loading]);

  const endsAt = me?.subscriptionExpiresAt ? new Date(me.subscriptionExpiresAt) : null;
  const daysLeft = endsAt ? (endsAt.getTime() - Date.now()) / DAY_MS : null;
  const due = Boolean(me?.hasAccess && me.subscriptionStatus === "active" && daysLeft !== null && daysLeft > 0 && daysLeft <= RENEWAL_WINDOW_DAYS);

  useEffect(() => {
    if (!awaiting || !token || !endsAt) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: Me) => {
          if (d.subscriptionExpiresAt && new Date(d.subscriptionExpiresAt).getTime() > endsAt.getTime()) {
            setRenewed(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaiting, token]);

  if (!due || !me || !endsAt) return null;
  const tier = me.subscriptionTier === "premium" ? "premium" : "basic";
  const price = tier === "premium" ? PREMIUM_PRICE_USD : BASIC_PRICE_USD;

  if (renewed) {
    return (
      <section role="status" className="mb-8 border border-black p-5 text-sm text-black sm:p-6">
        Thank you. Your plan is renewed for another 12 months after the current one ends.
      </section>
    );
  }

  return (
    <section className="mb-8 border border-signal p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
        <div>
          <p className="mb-1 text-signal k-label">Your plan ends soon</p>
          <h3 className="mb-2 text-black k-h4">
            {tier === "premium" ? "Premium" : "Basic"} ends on {endsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </h3>
          <p className="text-sm leading-relaxed text-black">
            Plans do not renew by themselves and we never charge you without you paying. Renew now for ${price} and the new 12 months start when this year ends, so you lose nothing.
          </p>
        </div>
        <div className="w-full md:w-72">
          {awaiting ? (
            <p role="status" className="border border-black p-3 text-sm text-black">
              Processing your renewal…
            </p>
          ) : token ? (
            <PayPalCheckout checkout={{ kind: "tier", tier }} token={token} onApproved={() => setAwaiting(true)} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
