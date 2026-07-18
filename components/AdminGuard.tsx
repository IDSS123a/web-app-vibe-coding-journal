"use client";

/**
 * Client-side admin route guard (UI level).
 *
 * Our auth is client-side (supabase-js stores the session in localStorage),
 * so server middleware cannot see it without switching to cookie-based SSR
 * sessions. Instead we guard /admin at the UI layer here, and every admin API
 * route independently re-checks the admin role (defense in depth). A non-admin
 * gets a clean "not authorized" screen instead of a raw 401 fetch error.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/use-session";

type GuardState = "checking" | "admin" | "anon" | "forbidden";

export function AdminGuard({ children }: { children: ReactNode }) {
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
      .then((d) => {
        if (active) setState(d.isAdmin ? "admin" : "forbidden");
      })
      .catch(() => {
        if (active) setState("forbidden");
      });
    return () => {
      active = false;
    };
  }, [token, loading]);

  if (loading || state === "checking") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Checking access…</div>
      </div>
    );
  }

  if (state === "anon") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You must be signed in as an admin to access this area.
        </p>
        <a href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
          Sign in →
        </a>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
          Not authorized
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your account does not have admin access.
        </p>
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800 font-semibold">
          Back to dashboard →
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
