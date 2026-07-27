"use client";

/**
 * Client-side subscription/trial route guard (UI level, Sprint 07, P-13).
 *
 * Same architecture as AdminGuard: auth is client-side (supabase-js session
 * in localStorage), so this cannot be a server middleware check without
 * cookie-based SSR sessions. The actual access decision (admin exemption +
 * trial/subscription evaluation) is computed server-side in /api/me — this
 * component only acts on the returned `hasAccess` boolean, never
 * re-implements the business logic client-side.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";

type GuardState = "checking" | "anon" | "blocked" | "ok";

interface MeResponse {
  authenticated: boolean;
  hasAccess: boolean;
  accessReason: string;
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { token, loading } = useSession();
  const [state, setState] = useState<GuardState>("checking");
  const [accessReason, setAccessReason] = useState<string>("");

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
        setAccessReason(d.accessReason);
        setState(d.hasAccess ? "ok" : "blocked");
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Checking access…</div>
      </div>
    );
  }

  if (state === "anon") {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          You must be signed in to view this page.
        </p>
        <a href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
          Sign in →
        </a>
      </div>
    );
  }

  if (state === "blocked") {
    const isTrialExpired = accessReason === "trial_expired";
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
          {isTrialExpired ? "Your trial has ended" : "Subscription required"}
        </h2>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          {isTrialExpired
            ? "Your 3-day trial is over. Subscribe to keep access to the Daily Report, Archive, and Bookmarks."
            : "Subscribe to access the Daily Report, Archive, and Bookmarks."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6 text-left dark:border-gray-700">
            <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-50">Basic</h3>
            <p className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-50">
              $10<span className="text-base font-normal text-gray-500">/year</span>
            </p>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Daily Report, Archive, and Bookmarks.
            </p>
            <button
              disabled
              className="w-full cursor-not-allowed rounded-md border border-gray-300 py-2 text-sm font-semibold text-gray-400 dark:border-gray-600"
            >
              Subscribe — coming soon
            </button>
          </div>
          <div className="rounded-lg border-2 border-blue-600 p-6 text-left">
            <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-50">Premium</h3>
            <p className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-50">
              $50<span className="text-base font-normal text-gray-500">/year</span>
            </p>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Everything in Basic, plus the Vibe-Coding Assistant chatbot.
            </p>
            <button
              disabled
              className="w-full cursor-not-allowed rounded-md bg-blue-600 py-2 text-sm font-semibold text-white opacity-50"
            >
              Subscribe — coming soon
            </button>
          </div>
        </div>
        <p className="mt-8 text-xs text-gray-400">
          Payment processing is not live yet.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
