"use client";

/**
 * Client-side subscription/trial route guard (UI level, Sprint 07/08, P-13/P-16).
 *
 * Same architecture as AdminGuard: auth is client-side (supabase-js session
 * in localStorage), so this cannot be a server middleware check without
 * cookie-based SSR sessions. The actual access decision (admin exemption +
 * trial/subscription evaluation) is computed server-side in /api/me — this
 * component only acts on the returned `hasAccess` boolean, never
 * re-implements the business logic client-side.
 *
 * Payment (Sprint 08, Decision 2): PayPal's client-side `onApprove` is UX
 * feedback ONLY — it never itself grants access. The actual activation
 * happens server-side when the verified PayPal webhook arrives
 * (POST /api/webhooks/paypal). After approval, this component polls
 * /api/me for a short window so the UI reflects the real state once the
 * webhook has landed, rather than trusting the client-side approval event.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";

type GuardState = "checking" | "anon" | "blocked" | "ok";
type TierName = "basic" | "premium";

interface MeResponse {
  authenticated: boolean;
  hasAccess: boolean;
  accessReason: string;
}

let paypalSdkPromise: Promise<void> | null = null;

function loadPayPalSdk(): Promise<void> {
  if (paypalSdkPromise) return paypalSdkPromise;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  paypalSdkPromise = new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error("NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured"));
      return;
    }
    if (document.getElementById("paypal-sdk")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });
  return paypalSdkPromise;
}

function PayPalTierButton({
  tier,
  token,
  onApproved,
}: {
  tier: TierName;
  token: string;
  onApproved: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
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
              const response = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tier }),
              });
              const data = await response.json();
              if (!response.ok || !data.orderId) {
                throw new Error(data.error || "Failed to create order");
              }
              return data.orderId;
            },
            // Capture is required for PayPal to ever emit
            // PAYMENT.CAPTURE.COMPLETED (what the webhook activates on) --
            // without it an approved order just sits uncaptured forever.
            // Capture does NOT itself grant access (Decision 2): only the
            // verified webhook writes subscription_status. This callback
            // just finalizes payment with PayPal, then tells the UI to
            // start polling for the real, server-confirmed state.
            onApprove: async (data: { orderID: string }) => {
              await fetch("/api/payments/capture-order", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderId: data.orderID }),
              }).catch(() => undefined);
              onApproved();
            },
          })
          .render(containerRef.current);
      })
      .catch((err: Error) => setSdkError(err.message));

    return () => {
      cancelled = true;
    };
  }, [tier, token, onApproved]);

  if (sdkError) {
    return <p className="text-sm text-[#FF3000]">{sdkError}</p>;
  }

  return <div ref={containerRef} />;
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { token, loading } = useSession();
  const [state, setState] = useState<GuardState>("checking");
  const [accessReason, setAccessReason] = useState<string>("");
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);

  function checkAccess() {
    if (!token) return;
    let active = true;
    fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: MeResponse) => {
        if (!active) return;
        setAccessReason(d.accessReason);
        setState(d.hasAccess ? "ok" : "blocked");
      })
      .catch(() => {
        if (active) setState("blocked");
      });
    return () => {
      active = false;
    };
  }

  useEffect(() => {
    if (loading) return;
    if (!token) {
      setState("anon");
      return;
    }
    return checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading]);

  // After client-side approval, poll /api/me for a short window so the UI
  // reflects real activation once the webhook lands, instead of trusting
  // the client-side approval event itself.
  useEffect(() => {
    if (!awaitingWebhook || !token) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: MeResponse) => {
          if (d.hasAccess) {
            setAccessReason(d.accessReason);
            setState("ok");
            setAwaitingWebhook(false);
            clearInterval(interval);
          } else if (attempts >= 8) {
            // ~16s elapsed — stop polling, leave the user a manual next step.
            clearInterval(interval);
          }
        })
        .catch(() => {
          if (attempts >= 8) clearInterval(interval);
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [awaitingWebhook, token]);

  if (loading || state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm font-bold uppercase tracking-widest text-black">Checking access…</div>
      </div>
    );
  }

  if (state === "anon") {
    return (
      <div className="border-4 border-black py-16 text-center">
        <p className="mb-4 text-sm text-black">You must be signed in to view this page.</p>
        <a
          href="/login"
          className="text-sm font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          Sign In →
        </a>
      </div>
    );
  }

  if (state === "blocked") {
    const isTrialExpired = accessReason === "trial_expired";

    if (awaitingWebhook) {
      return (
        <div className="mx-auto max-w-md border-4 border-black px-4 py-16 text-center">
          <h2 className="mb-2 text-xl font-black uppercase tracking-tight text-black">
            Processing Your Payment…
          </h2>
          <p className="text-sm text-black">
            This usually takes a few seconds. If access doesn&apos;t appear
            shortly, refresh this page.
          </p>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
          Access
        </p>
        <h2 className="mb-2 text-3xl font-black uppercase tracking-tighter text-black">
          {isTrialExpired ? "Your Trial Has Ended" : "Subscription Required"}
        </h2>
        <p className="mb-10 text-sm text-black">
          {isTrialExpired
            ? "Your 3-day trial is over. Subscribe to keep access to the Daily Report, Archive, and Bookmarks."
            : "Subscribe to access the Daily Report, Archive, and Bookmarks."}
        </p>
        <div className="grid gap-0 border-black sm:grid-cols-2 sm:border-4">
          <div className="border-4 border-black p-6 text-left sm:border-4 sm:border-r-0">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-black">Basic</h3>
            <p className="mb-4 text-4xl font-black text-black">
              $10<span className="text-sm font-normal">/year</span>
            </p>
            <p className="mb-6 text-sm text-black">Daily Report, Archive, and Bookmarks.</p>
            {token && (
              <PayPalTierButton
                tier="basic"
                token={token}
                onApproved={() => setAwaitingWebhook(true)}
              />
            )}
          </div>
          <div className="border-4 border-t-0 border-[#FF3000] p-6 text-left sm:border-t-4">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
              Premium
            </h3>
            <p className="mb-4 text-4xl font-black text-black">
              $50<span className="text-sm font-normal">/year</span>
            </p>
            <p className="mb-6 text-sm text-black">
              Everything in Basic, plus the Vibe-Coding Assistant chatbot.
            </p>
            {token && (
              <PayPalTierButton
                tier="premium"
                token={token}
                onApproved={() => setAwaitingWebhook(true)}
              />
            )}
          </div>
        </div>
        <p className="mt-8 text-xs uppercase tracking-wide text-black opacity-50">
          Sandbox mode — no real payment is processed.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
