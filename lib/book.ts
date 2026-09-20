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

/**
 * The book pop-up on the Prompt School pages (Director, 2026-09-20): it appears every 5 minutes of active reading
 * time as a modal window the reader can close or answer with "Get the book", and closes by itself after 20
 * seconds if nothing is clicked. The clock counts only seconds in which the page is visible and no pop-up is
 * open, and is kept in sessionStorage so that moving between School pages does not restart it.
 */
export const BOOK_POPUP = {
  intervalSeconds: 300,
  autoCloseSeconds: 20,
  storageKey: "ps-book-popup",
} as const;

/** One tick of the pop-up clock: a second counts only while the page is visible and no pop-up is open. */
export function advanceBookPopupClock(elapsedSeconds: number, pageVisible: boolean, popupOpen: boolean): number {
  return pageVisible && !popupOpen ? elapsedSeconds + 1 : elapsedSeconds;
}

export function isBookPopupDue(elapsedSeconds: number): boolean {
  return elapsedSeconds >= BOOK_POPUP.intervalSeconds;
}

/** Reads the stored clock defensively: anything that is not a sane non-negative number counts as zero. */
export function parseStoredElapsed(raw: string | null): number {
  if (!raw) return 0;
  try {
    const value = (JSON.parse(raw) as { seconds?: unknown }).seconds;
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 86_400 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}
