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

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { fetchMe } from "@/lib/auth/fetch-me";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { PaymentAssurance } from "@/components/PaymentAssurance";
import { BASIC_PRICE_USD, PREMIUM_PRICE_USD, centsPerDay } from "@/lib/pricing";

type GuardState = "checking" | "anon" | "blocked" | "ok";

interface MeResponse {
  authenticated: boolean;
  hasAccess: boolean;
  accessReason: string;
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { token, loading } = useSession();
  const [state, setState] = useState<GuardState>("checking");
  const [accessReason, setAccessReason] = useState<string>("");
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);

  function checkAccess() {
    if (!token) return;
    let active = true;
    fetchMe(token)
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
      fetchMe(token)
        .then((d: MeResponse) => {
          if (d.hasAccess) {
            setAccessReason(d.accessReason);
            setState("ok");
            setAwaitingWebhook(false);
            clearInterval(interval);
            // 2026-09-14, Director's request: a new subscriber sees a
            // concise one-page guide exactly once, right after payment
            // -- this branch only fires while awaitingWebhook is true
            // (a payment just happened in THIS session), never on a
            // normal page load by an already-active subscriber.
            router.push("/welcome");
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
  }, [awaitingWebhook, token, router]);

  if (loading || state === "checking") {
    return (
      <div className="flex items-center justify-center k-page">
        <div className="text-black k-label">Checking access…</div>
      </div>
    );
  }

  if (state === "anon") {
    return (
      <div className="border border-black py-16 text-center">
        <p className="mb-4 text-sm text-black">You must be signed in to view this page.</p>
        <Link
          href="/login"
          className="underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal k-label"
        >
          Sign In →
        </Link>
      </div>
    );
  }

  if (state === "blocked") {
    const isTrialExpired = accessReason === "trial_expired";
    // Admin Console & Subscription Lifecycle (specs/admin-console-and-
    // subscription-lifecycle/): a real admin block is NOT a billing
    // problem -- showing the "Subscribe" paywall below would be
    // actively misleading (paying again wouldn't fix it), so this gets
    // its own distinct message instead of falling into the generic path.
    if (accessReason === "blocked") {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="mb-2 text-signal k-label">Access</p>
          <h2 className="mb-2 text-black k-h2">
            Account Blocked
          </h2>
          <p className="text-sm text-black">
            Your account has been blocked. Contact support if you believe this is a mistake.
          </p>
        </div>
      );
    }

    if (awaitingWebhook) {
      return (
        <div className="mx-auto max-w-md border border-black px-4 py-16 text-center">
          <h2 className="mb-2 text-black k-h4">
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
      <div className="k-wide px-4 py-12 text-center sm:py-16">
        <p className="mb-2 text-signal k-label">
          Access
        </p>
        <h2 className="mb-2 text-black k-h2">
          {isTrialExpired ? "Your Trial Has Ended" : "Subscription Required"}
        </h2>
        <p className="mb-10 text-sm text-black">
          {isTrialExpired
            ? "Your 3-day trial is over. Subscribe to keep access to the Daily Report, Archive, and Bookmarks."
            : "Subscribe to access the Daily Report, Archive, and Bookmarks."}
        </p>
        <div className="grid gap-0 border-black sm:grid-cols-2 sm:border-4">
          <div className="border border-black p-6 text-left sm:border-4 sm:border-r-0">
            <h3 className="mb-1 text-black k-label">Basic</h3>
            <p className="k-value mb-1 text-3xl text-black">
              ${BASIC_PRICE_USD}<span className="text-sm font-normal">/year</span>
            </p>
            <p className="mb-4 text-xs text-black/70">About {centsPerDay(BASIC_PRICE_USD)} cents a day</p>
            <p className="mb-6 text-sm text-black">The Daily Report every day, the full Archive, and Bookmarks.</p>
            {token && (
              <PayPalCheckout
                checkout={{ kind: "tier", tier: "basic" }}
                token={token}
                onApproved={() => setAwaitingWebhook(true)}
              />
            )}
          </div>
          <div className="border border-t-0 border-signal p-6 text-left sm:border-t-4">
            <h3 className="mb-1 flex flex-wrap items-center gap-2 text-signal k-label">
              Premium
              <span className="border border-signal bg-signal px-2 py-0.5 text-[11px] text-white">Best value</span>
            </h3>
            <p className="k-value mb-1 text-3xl text-black">
              ${PREMIUM_PRICE_USD}<span className="text-sm font-normal">/year</span>
            </p>
            <p className="mb-4 text-xs text-black/70">About {centsPerDay(PREMIUM_PRICE_USD)} cents a day, for everything</p>
            <p className="mb-6 text-sm text-black">
              Everything in Basic, plus Vibe-Coding University (75 lessons, quizzes and level tests), the
              Dictionary of 2,600+ terms and the Assistant that writes your build-ready prompts.
            </p>
            {token && (
              <PayPalCheckout
                checkout={{ kind: "tier", tier: "premium" }}
                token={token}
                onApproved={() => setAwaitingWebhook(true)}
              />
            )}
          </div>
        </div>
        <PaymentAssurance variant="paragraph" />
      </div>
    );
  }

  return <>{children}</>;
}
