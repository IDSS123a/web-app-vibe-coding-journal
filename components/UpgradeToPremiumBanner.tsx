"use client";

/**
 * Basic to Premium upgrade entry point on the Dashboard (specs/admin-console-and-
 * subscription-lifecycle/). Renders nothing unless /api/me confirms the caller is an ACTIVE,
 * paying Basic subscriber. (Until 2026-09-19 it also showed for trial users, who have tier
 * "basic" but have paid nothing; the server refuses an upgrade order for them, so they saw a
 * button that could only fail. /api/me now returns subscriptionStatus and this checks it.)
 *
 * Flat $40 upgrade price (Director's explicit, non-prorated instruction). The order is created by
 * POST /api/payments/create-upgrade-order and captured by the existing capture route (via
 * PayPalCheckout). Activation happens through the verified PayPal webhook, same Decision 2
 * discipline as every other purchase: this component polls /api/me afterwards and never trusts
 * the client-side approval event.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { fetchMe } from "@/lib/auth/fetch-me";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import { PREMIUM_PRICE_USD, UPGRADE_PRICE_USD } from "@/lib/pricing";

interface MeResponse {
  hasAccess: boolean;
  subscriptionTier: "basic" | "premium" | null;
  subscriptionStatus?: "trial" | "active" | "expired" | null;
}

export function UpgradeToPremiumBanner() {
  const { token, loading } = useSession();
  const [eligible, setEligible] = useState(false);
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetchMe(token)
      .then((d: MeResponse) => {
        if (active) setEligible(d.hasAccess && d.subscriptionTier === "basic" && d.subscriptionStatus === "active");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, loading]);

  useEffect(() => {
    if (!awaitingWebhook || !token) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      fetchMe(token)
        .then((d: MeResponse) => {
          if (d.subscriptionTier === "premium") {
            setUpgraded(true);
            setAwaitingWebhook(false);
            clearInterval(interval);
          } else if (attempts >= 8) {
            // About 16 s: stop polling. Activation usually takes a few seconds; a refresh shows it.
            clearInterval(interval);
          }
        })
        .catch(() => {
          if (attempts >= 8) clearInterval(interval);
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [awaitingWebhook, token]);

  if (!eligible || upgraded) return null;

  return (
    <section className="mb-8 border border-signal p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
        <div>
          <p className="mb-1 text-signal k-label">Unlock the rest of the Journal</p>
          <h3 className="mb-2 text-black k-h4">
            Go Premium for ${UPGRADE_PRICE_USD}, not ${PREMIUM_PRICE_USD}
          </h3>
          <p className="mb-3 text-sm leading-relaxed text-black">
            Your ${PREMIUM_PRICE_USD - UPGRADE_PRICE_USD} already counts. Pay only the difference and open Vibe-Coding University
            (75 lessons with quizzes and level tests), the Dictionary of 2,600+ terms, the Assistant that writes your
            build-ready prompts and the Prompt School.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-black k-label">
            <li>University</li>
            <li>Dictionary</li>
            <li>Assistant</li>
            <li>Prompt School</li>
          </ul>
        </div>
        <div className="w-full md:w-72">
          {awaitingWebhook ? (
            <p role="status" className="border border-black p-3 text-sm text-black">
              Processing your upgrade…
            </p>
          ) : token ? (
            <PayPalCheckout checkout={{ kind: "upgrade" }} token={token} onApproved={() => setAwaitingWebhook(true)} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
