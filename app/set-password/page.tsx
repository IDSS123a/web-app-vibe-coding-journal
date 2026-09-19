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
    "w-full border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-[#FF3000]";
  const labelClass = "mb-1 block text-xs font-bold uppercase tracking-widest text-black";

  return (
    <div className="swiss-noise flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md border-4 border-black p-8 md:p-12">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Invitation</p>
        <h1 className="mb-8 text-4xl font-black uppercase tracking-tighter text-black">Set Password</h1>

        {sessionLoading && <p className="text-sm text-black opacity-60">Checking your invitation…</p>}

        {!sessionLoading && !token && (
          <div>
            <p className="mb-6 border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">
              This invitation link is invalid or has expired. Ask the administrator to send you a new one.
            </p>
            <a
              href="/login"
              className="inline-flex min-h-11 items-center text-sm font-bold uppercase tracking-wide underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
            >
              Go to Sign In
            </a>
          </div>
        )}

        {!sessionLoading && token && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-black">
              Choose a password for <strong>{email}</strong>. At least 8 characters, with one uppercase
              letter and one number.
            </p>

            {error && <div className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</div>}

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
              className="h-14 w-full border-4 border-black bg-black text-sm font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Set Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
