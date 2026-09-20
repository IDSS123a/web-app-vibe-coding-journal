/**
 * The Director's book, the source of the Prompt School (specs/prompt-school/). The School page cross-sells it:
 * the cover is shown, a click plays a small reward and opens the payment page in a new window.
 * The payment link is the Director's own PayPal payment link, supplied by her on 2026-09-20; the cover is
 * hers too. Nothing about the payment is handled here: the reader pays on PayPal's own page.
 */
export const BOOK = {
  title: "Mastering Prompt Engineering",
  subtitle: "a practical manual for advanced non-coders",
  author: "Davor Mulalić",
  coverSrc: "/mastering-prompt-engineering-cover.jpg",
  coverWidth: 720,
  coverHeight: 1040,
  payUrl: "https://www.paypal.com/ncp/payment/FKMN5XAS97TEY",
  /** Reward event key: the first click earns coins once per reader, later clicks only replay the animation. */
  rewardDedupeKey: "mastering-prompt-engineering",
} as const;
