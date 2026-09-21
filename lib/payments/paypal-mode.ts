/**
 * Which PayPal the server talks to (PDL-079).
 *
 * Until 2026-09-21 the API address was a hardcoded sandbox constant, on purpose (Sprint 08 gate: going live must be an
 * explicit, reviewed change, never a config toggle that copying a .env file could flip). The Director asked to go live,
 * so this is that reviewed change, and it keeps the safety the gate wanted: live needs BOTH an explicit
 * PAYPAL_MODE=live AND the Vercel Production environment. A laptop, a preview deployment or a copied .env can never reach
 * real money, whatever PAYPAL_MODE says. Anything else is the sandbox.
 */
export type PayPalMode = "sandbox" | "live";

export const PAYPAL_API_BASES: Record<PayPalMode, string> = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

type ModeEnv = Record<string, string | undefined>;

export function resolvePayPalMode(env: ModeEnv = process.env): PayPalMode {
  return env.PAYPAL_MODE === "live" && env.VERCEL_ENV === "production" ? "live" : "sandbox";
}

export function paypalApiBase(env: ModeEnv = process.env): string {
  return PAYPAL_API_BASES[resolvePayPalMode(env)];
}
