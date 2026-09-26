/**
 * Your account (PDL-079): the plan, a download of all your data, and deleting the account. These are the GDPR rights of access,
 * portability and erasure as buttons, so nobody has to write an e-mail to use them. Any signed-in person may open it, whatever
 * their plan, because the rights do not depend on payment.
 */

"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/db/client";
import { useSession } from "@/lib/auth/use-session";
import { fetchMe } from "@/lib/auth/fetch-me";
import { ACCOUNT_DELETE_CONFIRMATION } from "@/features/account/domain";

interface Me {
  email?: string;
  isAdmin: boolean;
  subscriptionTier: "basic" | "premium" | null;
  subscriptionStatus?: "trial" | "active" | "expired" | null;
  subscriptionExpiresAt?: string | null;
}

export default function AccountPage() {
  const { token, loading } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetchMe(token)
      .then((d: Me) => {
        if (active) setMe(d);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, loading]);

  async function download() {
    if (!token) return;
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/export", { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "vibe-coding-journal-my-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Could not prepare your data. Please try again in a minute.");
    } finally {
      setDownloading(false);
    }
  }

  async function deleteAccount(e: FormEvent) {
    e.preventDefault();
    if (!token || confirmText !== ACCOUNT_DELETE_CONFIRMATION) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirm: confirmText }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(body.error ?? "Could not delete the account. Please try again.");
        return;
      }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setMessage("Could not delete the account. Please check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  const ends = me?.subscriptionExpiresAt ? new Date(me.subscriptionExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <div className="k-page layer-campus">
      <div className="k-wide">
        <div className="mb-10 border-b border-studio-ink pb-8">
          <p className="mb-2 text-studio-blueberry k-clabel">Account</p>
          <h1 className="k-cheading">Your account</h1>
          {me?.email && <p className="k-cintro mt-3">{me.email}</p>}
        </div>

        {message && <p role="alert" className="mb-6 k-card-sm border-signal p-3 text-sm text-signal">{message}</p>}

        <div className="k-cards-lg">
          <section className="k-card p-5 sm:p-6">
            <h2 className="mb-2 text-studio-ink k-h4">Your plan</h2>
            <p className="text-sm text-studio-ink">
              {me
                ? `${me.subscriptionTier === "premium" ? "Premium" : "Basic"}, ${me.subscriptionStatus ?? ""}${ends ? `, until ${ends}` : ""}.`
                : "Loading…"}
            </p>
            <p className="mt-3 text-sm text-studio-ink">
              Plans do not renew by themselves. See <Link href="/subscription" className="underline decoration-1 underline-offset-2">Subscription and renewal</Link> and the{" "}
              <Link href="/refunds" className="underline decoration-1 underline-offset-2">Refund Policy</Link>.
            </p>
          </section>

          <section className="k-card p-5 sm:p-6">
            <h2 className="mb-2 text-studio-ink k-h4">Download your data</h2>
            <p className="mb-4 text-sm text-studio-ink">
              A copy of everything we hold about you, as a JSON file: your profile, plan, payments, bookmarks, progress, badges and Assistant history.
            </p>
            <button type="button" onClick={download} disabled={downloading || !token} className="inline-flex min-h-11 items-center justify-center disabled:opacity-40 k-cbtn k-cbtn-primary">
              {downloading ? "Preparing…" : "Download my data"}
            </button>
          </section>

          {me && !me.isAdmin && (
            <section className="k-card border-signal p-5 sm:p-6">
              <h2 className="mb-2 text-studio-ink k-h4">Delete your account</h2>
              <p className="mb-3 text-sm text-studio-ink">
                This deletes your account and everything in it: progress, badges, certificates, bookmarks and history. It cannot be undone, and a paid plan ends at once (refunds follow the{" "}
                <Link href="/refunds" className="underline decoration-1 underline-offset-2">Refund Policy</Link>). Payment records are kept as the law requires, without a link to you.
              </p>
              <form onSubmit={deleteAccount}>
                <label htmlFor="confirm-delete" className="mb-1 block text-studio-ink k-clabel">
                  Type {ACCOUNT_DELETE_CONFIRMATION} to confirm
                </label>
                <input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoComplete="off"
                  className="mb-3 block min-h-11 w-full k-card p-3 font-mono text-sm text-studio-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal"
                />
                <button
                  type="submit"
                  disabled={deleting || confirmText !== ACCOUNT_DELETE_CONFIRMATION}
                  className="inline-flex min-h-11 items-center justify-center border-2 border-signal bg-signal px-5 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-40"
                >
                  {deleting ? "Deleting…" : "Delete my account"}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
