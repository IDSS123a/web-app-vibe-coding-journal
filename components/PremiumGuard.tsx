"use client";

/**
 * Client-side Premium-tier route guard. Originally built for Vibe-
 * Coding University + Dictionary (specs/vibe-coding-university/SPEC.md,
 * confirmed 2026-09-14), generalized 2026-09-16 (specs/
 * prompt-blueprint-builder/, PDL-046) so the Vibe-Coding Assistant
 * reuses the same guard instead of a near-duplicate component — both
 * gate on the same $50/year premium tier (lib/permissions.ts
 * hasPremiumTierAccess). Same architecture as SubscriptionGuard/
 * AdminGuard: auth is client-side (supabase-js session in
 * localStorage), so this cannot be a server middleware check without
 * cookie-based SSR sessions. The actual access decision (admin
 * exemption + tier check) is computed server-side in /api/me — this
 * component only acts on the returned boolean for the given
 * `accessKey`, never re-implements the business logic client-side
 * (same discipline as SubscriptionGuard).
 */

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";

type GuardState = "checking" | "anon" | "blocked" | "accountBlocked" | "ok";

interface MeResponse {
  authenticated: boolean;
  hasAccess: boolean;
  hasUniversityAccess: boolean;
  hasAssistantAccess: boolean;
  isBlocked: boolean;
}

interface PremiumGuardProps {
  children: ReactNode;
  /** Which /api/me boolean gates this page. Defaults to University's, unchanged for existing callers. */
  accessKey?: "hasUniversityAccess" | "hasAssistantAccess";
  /** Shown in the "Premium Subscription Required" blocked state. */
  blockedMessage?: string;
}

export function PremiumGuard({
  children,
  accessKey = "hasUniversityAccess",
  blockedMessage = "The Vibe-Coding University and Dictionary are included with Premium.",
}: PremiumGuardProps) {
  const { token, loading } = useSession();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    if (loading) return;
    if (!token) {
      setState("anon");
      return;
    }
    let active = true;
    fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: MeResponse) => {
        if (!active) return;
        // Admin Console & Subscription Lifecycle (specs/admin-console-
        // and-subscription-lifecycle/): a real admin block gets its own
        // message -- "Premium Subscription Required" would be
        // misleading for someone who's actually blocked, not just on
        // the wrong tier.
        if (d.isBlocked) {
          setState("accountBlocked");
        } else {
          setState(d[accessKey] ? "ok" : "blocked");
        }
      })
      .catch(() => {
        if (active) setState("blocked");
      });
    return () => {
      active = false;
    };
  }, [token, loading, accessKey]);

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

  if (state === "accountBlocked") {
    return (
      <div className="mx-auto max-w-xl border-4 border-black px-4 py-16 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Access</p>
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-black">Account Blocked</h2>
        <p className="text-sm text-black">
          Your account has been blocked. Contact support if you believe this is a mistake.
        </p>
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className="mx-auto max-w-xl border-4 border-black px-4 py-16 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Premium</p>
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-black">
          Premium Subscription Required
        </h2>
        <p className="mb-8 text-sm text-black">{blockedMessage}</p>
        <a
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center border-4 border-black bg-black px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
