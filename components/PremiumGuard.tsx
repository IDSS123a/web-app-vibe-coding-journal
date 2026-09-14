"use client";

/**
 * Client-side Premium-tier route guard for Vibe-Coding University +
 * Dictionary (specs/vibe-coding-university/SPEC.md, confirmed
 * 2026-09-14). Same architecture as SubscriptionGuard/AdminGuard: auth
 * is client-side (supabase-js session in localStorage), so this cannot
 * be a server middleware check without cookie-based SSR sessions. The
 * actual access decision (admin exemption + tier check) is computed
 * server-side in /api/me's hasUniversityAccess field — this component
 * only acts on that boolean, never re-implements the business logic
 * client-side (same discipline as SubscriptionGuard).
 */

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";

type GuardState = "checking" | "anon" | "blocked" | "ok";

interface MeResponse {
  authenticated: boolean;
  hasAccess: boolean;
  hasUniversityAccess: boolean;
}

export function PremiumGuard({ children }: { children: ReactNode }) {
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
        if (active) setState(d.hasUniversityAccess ? "ok" : "blocked");
      })
      .catch(() => {
        if (active) setState("blocked");
      });
    return () => {
      active = false;
    };
  }, [token, loading]);

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
    return (
      <div className="mx-auto max-w-xl border-4 border-black px-4 py-16 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Premium</p>
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-black">
          Premium Subscription Required
        </h2>
        <p className="mb-8 text-sm text-black">
          The Vibe-Coding University and Dictionary are included with Premium.
        </p>
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
