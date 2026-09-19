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

import Link from "next/link";
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
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-sm font-bold uppercase tracking-widest text-black">Checking access…</div>
      </div>
    );
  }

  if (state === "anon") {
    return (
      <div className="border-4 border-black py-12 text-center">
        <p className="mb-4 text-sm text-black">You must be signed in as an admin to access this area.</p>
        <Link
          href="/login"
          className="text-sm font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          Sign In →
        </Link>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="border-4 border-black py-12 text-center">
        <h2 className="mb-2 text-xl font-black uppercase tracking-tight text-black">Not Authorized</h2>
        <p className="mb-4 text-sm text-black">Your account does not have admin access.</p>
        <Link
          href="/dashboard"
          className="text-sm font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          Back to Dashboard →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
