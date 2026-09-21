"use client";

/**
 * Set-password page for admin-invited accounts (specs/admin-console-and-
 * subscription-lifecycle/). An admin creates an account by invite
 * (features/admin-users/repository.ts createAdminInvitedUser) so the
 * admin never sets or sees the user's password (E-4); the emailed
 * Supabase invite link lands here with a one-time session in the URL
 * (supabase-js consumes it automatically on client init). The invited
 * user picks their own password here, after which they can sign in
 * normally. Before this page existed there was no way anywhere in the
 * app to set or change a password after the invite link was used.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db/client";
import { useSession } from "@/lib/auth/use-session";
import { setPasswordSchema } from "@/lib/validation/schemas";

export default function SetPasswordPage() {
  const router = useRouter();
  const { email, token, loading: sessionLoading } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = setPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/welcome");
  }

  const inputClass =
    "w-full border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-signal";
  const labelClass = "mb-1 block text-xs font-bold uppercase tracking-widest text-black";

  return (
    <div className="swiss-noise flex items-center justify-center k-page">
      <div className="w-full max-w-md border border-black p-8 md:p-12">
        <p className="mb-2 text-signal k-label">Password</p>
        <h1 className="mb-8 text-black k-display-card">Set Password</h1>

        {sessionLoading && <p className="text-sm text-black opacity-60">Checking your link…</p>}

        {!sessionLoading && !token && (
          <div>
            <p className="mb-6 border border-signal p-3 text-sm text-signal">
              This link is invalid or has expired. Request a new one with Forgot password on the Sign In page, or write to us.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-btn"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {!sessionLoading && token && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-black">
              Choose a password for <strong>{email}</strong>. At least 8 characters, with one uppercase
              letter and one number.
            </p>

            {error && <div className="border border-signal p-3 text-sm text-signal">{error}</div>}

            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={saving}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={saving}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="h-14 w-full disabled:cursor-not-allowed disabled:opacity-50 k-btn k-btn-primary"
            >
              {saving ? "Saving…" : "Set Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
