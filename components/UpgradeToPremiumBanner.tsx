"use client";

/**
 * Basic→Premium upgrade entry point (specs/admin-console-and-
 * subscription-lifecycle/). Renders nothing unless /api/me confirms the
 * caller is currently on the 'basic' tier with active access -- same
 * "server decides, client only acts on the boolean" discipline as
 * SubscriptionGuard/PremiumGuard, not re-implemented here.
 *
 * Flat $40 upgrade price (Director's explicit, non-prorated instruction)
 * -- POST /api/payments/create-upgrade-order, capture via the EXISTING
 * /api/payments/capture-order (unchanged -- it only needs an orderId,
 * works for either order type). Activation happens via the verified
 * PayPal webhook, same Decision 2 discipline as every other purchase in
 * this app -- this component polls /api/me afterward exactly like
 * SubscriptionGuard does, rather than trusting the client-side approval
 * event.
 */

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { loadPayPalSdk } from "@/lib/payments/load-paypal-sdk";

interface MeResponse {
  hasAccess: boolean;
  subscriptionTier: "basic" | "premium" | null;
}

export function UpgradeToPremiumBanner() {
  const { token, loading } = useSession();
  const [eligible, setEligible] = useState(false);
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: MeResponse) => {
        if (active) setEligible(d.hasAccess && d.subscriptionTier === "basic");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, loading]);

  useEffect(() => {
    if (!awaitingWebhook || !token) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: MeResponse) => {
          if (d.subscriptionTier === "premium") {
            setUpgraded(true);
            setAwaitingWebhook(false);
            clearInterval(interval);
          } else if (attempts >= 8) {
            // ~16s elapsed -- stop polling, same "usually takes a few
            // seconds, refresh if it doesn't appear" fallback as
            // SubscriptionGuard's own webhook-await UX.
            clearInterval(interval);
          }
        })
        .catch(() => {
          if (attempts >= 8) clearInterval(interval);
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [awaitingWebhook, token]);

  useEffect(() => {
    if (!eligible || !token || !containerRef.current) return;
    let cancelled = false;

    loadPayPalSdk()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paypal = (window as any).paypal;
        if (!paypal) {
          setSdkError("PayPal SDK unavailable");
          return;
        }
        paypal
          .Buttons({
            createOrder: async () => {
              const response = await fetch("/api/payments/create-upgrade-order", {
                method: "POST",
                headers: { authorization: `Bearer ${token}` },
              });
              const data = await response.json();
              if (!response.ok || !data.orderId) {
                throw new Error(data.error || "Failed to create upgrade order");
              }
              return data.orderId;
            },
            onApprove: async (data: { orderID: string }) => {
              await fetch("/api/payments/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId: data.orderID }),
              }).catch(() => undefined);
              setAwaitingWebhook(true);
            },
          })
          .render(containerRef.current);
      })
      .catch((err: Error) => setSdkError(err.message));

    return () => {
      cancelled = true;
    };
  }, [eligible, token]);

  if (!eligible || upgraded) return null;

  return (
    <div className="mb-8 border-4 border-[#FF3000] p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Upgrade Available</p>
      <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-black">
        Get Premium — pay only the $40 difference
      </h3>
      <p className="mb-4 text-sm text-black">
        You&apos;re on Basic. Upgrade to Premium to unlock Vibe-Coding University and the Vibe-Coding
        Assistant — you only pay the $40 difference, not the full $50 again.
      </p>
      {awaitingWebhook ? (
        <p className="text-sm text-black opacity-70">Processing your upgrade…</p>
      ) : (
        <>
          {sdkError && <p className="mb-2 text-sm text-[#FF3000]">{sdkError}</p>}
          <div ref={containerRef} />
        </>
      )}
    </div>
  );
}
