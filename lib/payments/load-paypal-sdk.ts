"use client";

/**
 * Shared PayPal JS SDK loader — extracted from components/SubscriptionGuard.tsx
 * (specs/admin-console-and-subscription-lifecycle/) so the new Basic→Premium
 * upgrade button (components/UpgradeToPremiumBanner.tsx) doesn't duplicate
 * this logic. Idempotent: checks for the existing <script id="paypal-sdk">
 * tag before injecting a second one, and caches the loading promise at
 * module scope so concurrent callers (e.g. both components mounted at
 * once) share one load.
 */

let paypalSdkPromise: Promise<void> | null = null;

export function loadPayPalSdk(): Promise<void> {
  if (paypalSdkPromise) return paypalSdkPromise;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  paypalSdkPromise = new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error("NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured"));
      return;
    }
    if (document.getElementById("paypal-sdk")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.body.appendChild(script);
  });
  return paypalSdkPromise;
}
