"use client";

/**
 * The one PayPal button used by every purchase screen: buying Basic, buying Premium,
 * and the flat $40 Basic to Premium upgrade. It replaces three near-identical copies
 * (SubscriptionGuard, UpgradeToPremiumBanner and the new PremiumPitch).
 *
 * Payment discipline is unchanged (DECISION_LOG Decision 2): the client side
 * `onApprove` only finalises the order with PayPal (capture) and then calls
 * `onApproved` so the caller can start polling /api/me. Access is granted only by the
 * verified PayPal webhook on the server, never by anything that happens here.
 */

import { useEffect, useRef, useState } from "react";
import { loadPayPalSdk } from "@/lib/payments/load-paypal-sdk";

export type CheckoutKind = { kind: "tier"; tier: "basic" | "premium" } | { kind: "upgrade" };

interface Props {
  checkout: CheckoutKind;
  token: string;
  onApproved: () => void;
}

export function PayPalCheckout({ checkout, token, onApproved }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  // The newest callback is read at click time, so a parent that re-renders (and passes a new
  // arrow function) never tears the PayPal button down and rebuilds it.
  const approvedRef = useRef(onApproved);
  approvedRef.current = onApproved;
  const checkoutKey = checkout.kind === "tier" ? `tier:${checkout.tier}` : "upgrade";

  useEffect(() => {
    let cancelled = false;

    loadPayPalSdk()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paypal = (window as any).paypal;
        if (!paypal) {
          setSdkError("PayPal is not available right now. Please reload the page and try again.");
          return;
        }
        paypal
          .Buttons({
            createOrder: async () => {
              const response =
                checkout.kind === "upgrade"
                  ? await fetch("/api/payments/create-upgrade-order", {
                      method: "POST",
                      headers: { authorization: `Bearer ${token}` },
                    })
                  : await fetch("/api/payments/create-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
                      body: JSON.stringify({ tier: checkout.tier }),
                    });
              const data = await response.json();
              if (!response.ok || !data.orderId) throw new Error(data.error || "Failed to create order");
              return data.orderId;
            },
            // Capture is required for PayPal to emit PAYMENT.CAPTURE.COMPLETED, which is what
            // the webhook activates on. It does not itself grant access (Decision 2).
            onApprove: async (data: { orderID: string }) => {
              await fetch("/api/payments/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId: data.orderID }),
              }).catch(() => undefined);
              approvedRef.current();
            },
          })
          .render(containerRef.current);
      })
      .catch((err: Error) => setSdkError(err.message));

    return () => {
      cancelled = true;
    };
    // checkoutKey stands for the checkout object, which is re-created on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutKey, token]);

  if (sdkError) return <p className="text-sm text-[#FF3000]">{sdkError}</p>;
  return <div ref={containerRef} className="min-h-[45px]" />;
}
