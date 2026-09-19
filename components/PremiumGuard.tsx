"use client";

/**
 * Client-side Premium-tier route guard. Originally built for Vibe-
 * Coding University + Dictionary (specs/vibe-coding-university/SPEC.md,
 * confirmed 2026-09-14), generalized 2026-09-16 (specs/
 * prompt-blueprint-builder/, PDL-046) so the Vibe-Coding Assistant
 * reuses the same guard instead of a near-duplicate component; all gate on
 * the same $50/year premium tier (lib/permissions.ts hasPremiumTierAccess).
 * Same architecture as SubscriptionGuard/AdminGuard: auth is client-side
 * (supabase-js session in localStorage), so this cannot be a server
 * middleware check without cookie-based SSR sessions. The actual access
 * decision (admin exemption + tier check) is computed server-side in
 * /api/me; this component only acts on the returned booleans for the given
 * `accessKey`, never re-implements the business logic client-side (same
 * discipline as SubscriptionGuard).
 *
 * The blocked state is now a sales screen (components/PremiumPitch.tsx), not
 * a bare "Premium required" line (Director, 2026-09-19).
 */

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumPitch, type PremiumFeature } from "@/components/PremiumPitch";

type GuardState = "checking" | "anon" | "blocked" | "accountBlocked" | "ok";

interface MeResponse {
  authenticated: boolean;
  hasAccess: boolean;
  hasUniversityAccess: boolean;
  hasAssistantAccess: boolean;
  hasPromptSchoolAccess: boolean;
  isBlocked: boolean;
  subscriptionTier: "basic" | "premium" | null;
  subscriptionStatus?: "trial" | "active" | "expired" | null;
}

interface PremiumGuardProps {
  children: ReactNode;
  /** Which /api/me boolean gates this page. Defaults to University's, unchanged for existing callers. */
  accessKey?: "hasUniversityAccess" | "hasAssistantAccess" | "hasPromptSchoolAccess";
  /** Which feature the upsell screen describes. Defaults from accessKey. */
  feature?: PremiumFeature;
}

export function PremiumGuard({ children, accessKey = "hasUniversityAccess", feature }: PremiumGuardProps) {
  const { token, loading } = useSession();
  const [state, setState] = useState<GuardState>("checking");
  const [isActiveBasic, setIsActiveBasic] = useState(false);
  const shownFeature: PremiumFeature =
    feature ?? (accessKey === "hasAssistantAccess" ? "assistant" : accessKey === "hasPromptSchoolAccess" ? "promptschool" : "university");

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
        // A real admin block gets its own message: "Premium required" would be misleading
        // for someone who is blocked rather than on the wrong tier.
        if (d.isBlocked) {
          setState("accountBlocked");
          return;
        }
        // Only a PAYING Basic subscriber pays the $40 difference. A trial user has tier
        // "basic" too but has paid nothing, and the server refuses an upgrade order for them.
        setIsActiveBasic(d.subscriptionTier === "basic" && d.subscriptionStatus === "active");
        setState(d[accessKey] ? "ok" : "blocked");
      })
      .catch(() => {
        if (active) setState("blocked");
      });
    return () => {
      active = false;
    };
  }, [token, loading, accessKey]);

  const onUnlocked = useCallback(() => setState("ok"), []);

  if (loading || state === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="text-sm font-bold uppercase tracking-widest text-black">Checking access…</div>
      </div>
    );
  }

  if (state === "anon") {
    return (
      <div className="border-4 border-black py-16 text-center">
        <p className="mb-4 text-sm text-black">You must be signed in to view this page.</p>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-sm font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          Sign In →
        </Link>
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
      <div className="min-h-dvh bg-white px-4 py-10 sm:py-14 md:px-8">
        <PremiumPitch
          feature={shownFeature}
          audience={{ isActiveBasic }}
          token={token}
          unlockedKey={accessKey}
          onUnlocked={onUnlocked}
        />
      </div>
    );
  }

  return <>{children}</>;
}
