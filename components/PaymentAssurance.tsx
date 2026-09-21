"use client";

/**
 * The reassurance line under a payment button (PDL-079). While the site is in PayPal's sandbox it says so (no real money moves);
 * once live it states the refund promise and that plans do not renew by themselves, with links to the pages that say so in full.
 * The mode comes from /api/me, never from the browser: until it is known the live wording shows, so a real customer can never be
 * told "sandbox" by a slow request.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { REFUND_DAYS } from "@/features/legal/content";

export function usePayPalMode(): "sandbox" | "live" {
  const { token, loading } = useSession();
  const [mode, setMode] = useState<"sandbox" | "live">("live");
  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { paypalMode?: "sandbox" | "live" }) => {
        if (active && d.paypalMode) setMode(d.paypalMode);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, loading]);
  return mode;
}

/** `items` renders list items (inside a list), `paragraph` renders one paragraph. */
export function PaymentAssurance({ variant }: { variant: "items" | "paragraph" }) {
  const mode = usePayPalMode();

  if (mode === "sandbox") {
    return variant === "items" ? <li>Sandbox mode: no real payment is processed.</li> : <p className="mt-8 text-black opacity-50 k-label">Sandbox mode, no real payment is processed.</p>;
  }

  const links = (
    <>
      {REFUND_DAYS} day money back guarantee, no automatic renewal.{" "}
      <Link href="/refunds" className="underline decoration-1 underline-offset-2 hover:text-signal">Refunds</Link>,{" "}
      <Link href="/subscription" className="underline decoration-1 underline-offset-2 hover:text-signal">renewal</Link>,{" "}
      <Link href="/terms" className="underline decoration-1 underline-offset-2 hover:text-signal">terms</Link>.
    </>
  );
  return variant === "items" ? <li>{links}</li> : <p className="mt-8 text-xs text-black/70">{links}</p>;
}
