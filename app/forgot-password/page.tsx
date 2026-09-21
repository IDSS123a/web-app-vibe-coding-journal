"use client";

/**
 * Forgot password (PDL-079). Supabase e-mails a one-time link that lands on /set-password, where the reader picks a new
 * password. The answer is the same whether or not the address has an account, so the form cannot be used to find out who is a
 * customer.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/db/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/set-password`,
    });
    setSending(false);
    // A rate limit is worth telling the reader; anything else looks the same as success.
    if (resetError && /rate|too many|seconds/i.test(resetError.message)) {
      setError("Too many requests. Please wait a minute and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="swiss-noise flex items-center justify-center k-page">
      <div className="w-full max-w-md border border-black p-8 md:p-12">
        <p className="mb-2 text-signal k-label">Access</p>
        <h1 className="mb-8 text-black k-display-card">Forgot password</h1>

        {sent ? (
          <p role="status" className="border border-black p-3 text-sm text-black">
            If an account exists for that address, an e-mail with a link to choose a new password is on its way. The link works once
            and for a short time. Check your spam folder too.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-black">Enter the e-mail address of your account and we will send you a link to choose a new password.</p>
            {error && <div className="border border-signal p-3 text-sm text-signal">{error}</div>}
            <div>
              <label htmlFor="forgot-email" className="mb-1 block text-black k-label">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
                className="min-h-11 w-full border-b border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-signal"
              />
            </div>
            <button type="submit" disabled={sending} className="h-14 w-full disabled:cursor-not-allowed disabled:opacity-50 k-btn k-btn-primary">
              {sending ? "Sending…" : "Send the link"}
            </button>
          </form>
        )}

        <p className="mt-8 text-sm text-black">
          <Link href="/login" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:text-signal k-label">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
