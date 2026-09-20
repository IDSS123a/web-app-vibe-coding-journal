import { describe, expect, it } from "vitest";
import { BOOK, BOOK_POPUP, advanceBookPopupClock, isBookPopupDue, parseStoredElapsed } from "./book";

describe("book pop-up clock", () => {
  it("counts a second only while the page is visible and no pop-up is open", () => {
    expect(advanceBookPopupClock(10, true, false)).toBe(11);
    expect(advanceBookPopupClock(10, false, false)).toBe(10);
    expect(advanceBookPopupClock(10, true, true)).toBe(10);
  });
  it("is due after exactly five minutes", () => {
    expect(BOOK_POPUP.intervalSeconds).toBe(300);
    expect(isBookPopupDue(299)).toBe(false);
    expect(isBookPopupDue(300)).toBe(true);
  });
  it("closes by itself after 20 seconds", () => {
    expect(BOOK_POPUP.autoCloseSeconds).toBe(20);
  });
  it("reads the stored clock defensively", () => {
    expect(parseStoredElapsed(null)).toBe(0);
    expect(parseStoredElapsed("not json")).toBe(0);
    expect(parseStoredElapsed(JSON.stringify({ seconds: 42.9 }))).toBe(42);
    expect(parseStoredElapsed(JSON.stringify({ seconds: -5 }))).toBe(0);
    expect(parseStoredElapsed(JSON.stringify({ seconds: "9" }))).toBe(0);
    expect(parseStoredElapsed(JSON.stringify({ seconds: 1e9 }))).toBe(0);
  });
  it("points at the book's PayPal payment page only", () => {
    expect(BOOK.payUrl.startsWith("https://www.paypal.com/")).toBe(true);
  });
});
