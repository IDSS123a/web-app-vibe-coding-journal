/**
 * PayPal REST client (Sprint 08, P-16)
 *
 * Raw fetch, no SDK — same reasoning as lib/ai/gemini-provider.ts: PayPal's
 * REST API is simple enough that a dependency doesn't earn its place, and
 * a raw fetch keeps the actual HTTP shape visible rather than hidden
 * behind SDK internals (this matters especially for webhook signature
 * verification, where trusting the wire format precisely is the point).
 *
 * SANDBOX ONLY — hardcoded, deliberately not an env var. Per
 * sprints/SPRINT_08.md's hard-blocking DoD gate, switching to live mode
 * must be its own explicit, reviewed code change, never a config toggle
 * that could be flipped by accident or by copying a .env file.
 */

const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

export type TierName = "basic" | "premium";

const TIER_PRICES_USD: Record<TierName, string> = {
  basic: "10.00",
  premium: "50.00",
};

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET is not configured");
  }
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal OAuth token request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (typeof data.access_token !== "string") {
    throw new Error("PayPal OAuth response missing access_token");
  }
  return data.access_token;
}

/**
 * Creates a PayPal order for the given tier. `custom_id` carries our
 * internal user ID so the webhook (which has no session context) can
 * correlate a confirmed capture back to the correct account — this is
 * the standard PayPal-recommended correlation mechanism, not a
 * workaround.
 */
export async function createPayPalOrder(
  tier: TierName,
  userId: string,
): Promise<{ orderId: string; approveUrl: string | null }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: userId,
          description: `Vibe-Coding Journal — ${tier === "premium" ? "Premium" : "Basic"} (annual)`,
          amount: {
            currency_code: "USD",
            value: TIER_PRICES_USD[tier],
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal create-order failed: HTTP ${response.status} ${body}`);
  }

  const data = await response.json();
  const approveLink = (data.links as Array<{ rel: string; href: string }> | undefined)?.find(
    (l) => l.rel === "approve",
  );

  return {
    orderId: data.id as string,
    approveUrl: approveLink?.href ?? null,
  };
}

// Admin Console & Subscription Lifecycle (specs/admin-console-and-
// subscription-lifecycle/): flat Basic->Premium upgrade price, matches
// features/subscription-lifecycle/domain.ts BASIC_TO_PREMIUM_UPGRADE_PRICE_USD.
const UPGRADE_PRICE_USD = "40.00";

/**
 * Creates a PayPal order for the flat $10->$50 upgrade difference, not
 * a fresh tier purchase. Parallel to createPayPalOrder rather than a
 * parameter on it -- the two have genuinely different pricing sources
 * (TIER_PRICES_USD vs. a fixed upgrade amount) and keeping them
 * separate avoids widening TierName with a third, non-tier value.
 * capturePayPalOrder below is unchanged and works for either order
 * type, since it only needs the orderId.
 */
export async function createPayPalUpgradeOrder(
  userId: string,
): Promise<{ orderId: string; approveUrl: string | null }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: userId,
          description: "Vibe-Coding Journal — Basic to Premium upgrade (annual)",
          amount: {
            currency_code: "USD",
            value: UPGRADE_PRICE_USD,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal create-upgrade-order failed: HTTP ${response.status} ${body}`);
  }

  const data = await response.json();
  const approveLink = (data.links as Array<{ rel: string; href: string }> | undefined)?.find(
    (l) => l.rel === "approve",
  );

  return {
    orderId: data.id as string,
    approveUrl: approveLink?.href ?? null,
  };
}

/**
 * Captures a buyer-approved order. Without this, an approved order just
 * sits in APPROVED status forever -- PayPal only emits
 * PAYMENT.CAPTURE.COMPLETED (the event our webhook activates on) once
 * something actually calls capture. Server-side here (not the client SDK's
 * own capture action) to keep this on the same trusted path as order
 * creation.
 */
export async function capturePayPalOrder(orderId: string): Promise<{ status: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal capture-order failed: HTTP ${response.status} ${body}`);
  }

  const data = await response.json();
  return { status: data.status as string };
}

/**
 * Verifies a webhook's signature via PayPal's own verify-webhook-signature
 * endpoint (the PayPal-recommended approach — delegates trust to PayPal
 * rather than this project re-implementing certificate/signature crypto).
 */
export async function verifyWebhookSignature(params: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookEvent: unknown;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("PAYPAL_WEBHOOK_ID is not configured");
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: params.transmissionId,
      transmission_time: params.transmissionTime,
      cert_url: params.certUrl,
      auth_algo: params.authAlgo,
      transmission_sig: params.transmissionSig,
      webhook_id: webhookId,
      webhook_event: params.webhookEvent,
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal webhook verification request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.verification_status === "SUCCESS";
}
