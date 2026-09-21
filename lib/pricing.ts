/**
 * Prices as the reader sees them (single place for every upsell screen, M-7).
 * The amounts that are actually CHARGED live server-side (lib/payments/paypal-client.ts,
 * features/payments/domain.ts, features/subscription-lifecycle/domain.ts); a test
 * (lib/pricing.test.ts) keeps these display values equal to the charged ones.
 */
export const BASIC_PRICE_USD = 10;
export const PREMIUM_PRICE_USD = 50;
export const UPGRADE_PRICE_USD = 40;

/** The free trial a new account gets, with Premium access (P-13). Shown in the legal pages and used at registration. */
export const TRIAL_DAYS = 3;

/** Cost per day of a yearly price, in cents, rounded to the nearest cent. */
export function centsPerDay(yearlyUsd: number): number {
  return Math.round((yearlyUsd / 365) * 100);
}

/** Cost per month of a yearly price, in dollars with two decimals. */
export function perMonthUsd(yearlyUsd: number): string {
  return (yearlyUsd / 12).toFixed(2);
}
