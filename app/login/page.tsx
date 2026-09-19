"use client";

/**
 * Login page — client-side Supabase sign-in.
 * signInWithPassword stores the session in localStorage so admin pages
 * (via useSession) can attach the access_token to API calls.
 *
 * Post-login redirect fixed 2026-09-16 (P-21 UI/UX pass): this
 * unconditionally sent EVERY successful sign-in to
 * /admin/review-queue, regardless of role -- found live testing that a
 * regular subscriber (the actual majority of this page's traffic; the
 * "Sign In" link in SiteNav and "No account? Register" here are both
 * general-purpose, not admin-only) got bounced straight into
 * AdminGuard's "not authorized" screen immediately after successfully
 * signing in. Now checks /api/me (same endpoint AdminGuard itself
 * already uses) and routes by actual role.
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const accessToken = signInData.session?.access_token;
    let isAdmin = false;
    try {
      if (accessToken) {
        const res = await fetch("/api/me", { headers: { authorization: `Bearer ${accessToken}` } });
        const me = await res.json();
        isAdmin = Boolean(me.isAdmin);
      }
    } catch {
      // Fail safe to the regular-user destination, not the admin one --
      // an unreachable /api/me should never accidentally route a
      // non-admin into an admin-only page.
      isAdmin = false;
    }

    setLoading(false);
    router.push(isAdmin ? "/admin/review-queue" : "/dashboard");
  }

  return (
    <div className="swiss-noise flex min-h-dvh items-center justify-center bg-white px-4">
      <div className="w-full max-w-md border-4 border-black p-8 md:p-12">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
          Access
        </p>
        <h1 className="mb-8 text-4xl font-black uppercase tracking-tighter text-black">
          Sign In
        </h1>

        {error && (
          <div className="mb-6 border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-black">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-[#FF3000]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-black">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-[#FF3000]"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full border-4 border-black bg-black text-sm font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-sm text-black">
          No account?{" "}
          <Link
            href="/register"
            className="font-bold uppercase tracking-wide underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
