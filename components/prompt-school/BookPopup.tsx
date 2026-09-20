"use client";

/**
 * The book pop-up of the Prompt School (Director, 2026-09-20). It replaces the fixed book block: every 5 minutes of
 * active reading it opens as a modal window with the cover of "Mastering Prompt Engineering". The reader can close
 * it ("Not now", the cross or Escape) or press "Get the book"; if nothing is clicked it closes by itself after
 * 20 seconds, with a bar that shows the time left (a true countdown, no invented scarcity).
 *
 * "Get the book" plays the small celebration (the cover jumps, confetti, and 25 coins the first time, once per reader,
 * through the existing rewards system) and then opens the book's PayPal payment page in a new window. The new window is
 * opened inside the click so pop-up blockers allow it, and pointed at PayPal after the celebration; if the browser
 * blocks it anyway, a plain link appears. Nothing here touches payment details: the reader pays on PayPal's own page.
 *
 * The clock lives in sessionStorage (see lib/book.ts), so moving between School pages does not restart it. The
 * component is mounted inside each page's Premium guard, so only readers with access ever see it.
 */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { BOOK, BOOK_POPUP, advanceBookPopupClock, isBookPopupDue, parseStoredElapsed } from "@/lib/book";
import { useRewards } from "@/components/rewards/RewardsProvider";

const CELEBRATION_MS = 1600;

function readElapsed(): number {
  try {
    return parseStoredElapsed(window.sessionStorage.getItem(BOOK_POPUP.storageKey));
  } catch {
    return 0;
  }
}

function writeElapsed(seconds: number) {
  try {
    window.sessionStorage.setItem(BOOK_POPUP.storageKey, JSON.stringify({ seconds }));
  } catch {
    // Storage can be blocked (private windows, strict settings); the clock then simply restarts on the next page.
  }
}

export function BookPopup() {
  const { award, sparkle } = useRewards();
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number>(BOOK_POPUP.autoCloseSeconds);
  const [busy, setBusy] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const timers = useRef<number[]>([]);
  const elapsed = useRef(0);
  const openRef = useRef(false);
  openRef.current = open;

  // The clock: one tick a second, counted only while the page is visible and no pop-up is open.
  useEffect(() => {
    elapsed.current = readElapsed();
    const pending = timers.current;
    const id = window.setInterval(() => {
      elapsed.current = advanceBookPopupClock(elapsed.current, document.visibilityState === "visible", openRef.current);
      if (!openRef.current && isBookPopupDue(elapsed.current)) {
        elapsed.current = 0;
        returnFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setRemaining(BOOK_POPUP.autoCloseSeconds);
        setBusy(false);
        setJumping(false);
        setBlocked(false);
        setOpen(true);
      }
      writeElapsed(elapsed.current);
    }, 1000);
    return () => {
      window.clearInterval(id);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setBusy(false);
    setJumping(false);
    returnFocusTo.current?.focus?.();
  }, []);

  // Closes by itself after 20 seconds unless the reader started "Get the book" or the browser blocked its window.
  useEffect(() => {
    if (!open || busy || blocked) return;
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearInterval(id);
  }, [open, busy, blocked]);

  useEffect(() => {
    if (open && remaining <= 0 && !busy && !blocked) close();
  }, [open, remaining, busy, blocked, close]);

  // Keyboard: Escape closes, Tab stays inside the window, focus moves in on open.
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]");
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, close]);

  function getTheBook() {
    if (busy) return;
    // Opened synchronously, inside the click, so pop-up blockers allow it.
    const win = window.open("", "_blank");
    if (win) {
      win.opener = null;
      try {
        win.document.title = BOOK.title;
        win.document.body.innerText = "Opening the book page…";
      } catch {
        // A blank window we just opened is ours to write to; if the browser says otherwise, the redirect below still runs.
      }
    }
    setBusy(true);
    setBlocked(false);
    setJumping(true);
    sparkle();
    void award("book_discovery", BOOK.rewardDedupeKey);

    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(
      window.setTimeout(() => {
        if (win && !win.closed) {
          win.location.href = BOOK.payUrl;
          close();
        } else {
          setBusy(false);
          setBlocked(true);
        }
      }, reduced ? 300 : CELEBRATION_MS),
    );
  }

  if (!open) return null;

  const share = Math.max(0, Math.min(100, (remaining / BOOK_POPUP.autoCloseSeconds) * 100));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && !busy && close()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-popup-title"
        aria-describedby="book-popup-text"
        tabIndex={-1}
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto border-4 border-black bg-white focus-visible:outline-none"
      >
        <button
          type="button"
          onClick={close}
          disabled={busy}
          aria-label="Close"
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center border-b-4 border-l-4 border-black bg-white text-black transition-colors duration-150 ease-out hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#FF3000] disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-5 p-5 pt-12 sm:flex-row sm:items-start sm:gap-6 sm:p-6 sm:pt-12">
          <button
            type="button"
            onClick={getTheBook}
            aria-label={`Get the book ${BOOK.title} by ${BOOK.author}. Opens the payment page in a new window.`}
            className={`block w-20 shrink-0 border-4 min-[400px]:w-28 border-black bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] sm:w-36 ${
              jumping ? "book-jump" : "transition-transform duration-150 ease-out hover:-translate-y-1"
            }`}
          >
            <Image
              src={BOOK.coverSrc}
              alt={`Cover of the book ${BOOK.title}, ${BOOK.subtitle}, by ${BOOK.author}`}
              width={BOOK.coverWidth}
              height={BOOK.coverHeight}
              sizes="144px"
              className="block h-auto w-full"
            />
          </button>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#FF3000]">The book behind this School</p>
            <h2 id="book-popup-title" className="text-xl font-black uppercase leading-tight tracking-tighter text-black sm:text-2xl">
              {BOOK.title}
            </h2>
            <p className="mt-1 text-xs text-black">
              by {BOOK.author}, {BOOK.subtitle}
            </p>
            <p id="book-popup-text" className="mt-3 text-sm leading-relaxed text-black">
              Every chapter of this School is written from this book. Own the complete book: eleven chapters, a glossary, fifteen
              ready-made prompt blueprints, a Markdown manual, a techniques quick reference, further reading and a guide to prompting
              platforms and tools.
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-black">Tap the book for a small surprise</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={getTheBook}
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center border-4 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] disabled:opacity-60 sm:w-auto"
              >
                Get the book →
              </button>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="inline-flex min-h-11 w-full items-center justify-center border-4 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] disabled:opacity-40 sm:w-auto"
              >
                Not now
              </button>
            </div>

            {blocked ? (
              <p role="status" className="mt-3 text-xs text-black">
                Your browser blocked the new window.{" "}
                <a href={BOOK.payUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-2 underline-offset-4 hover:text-[#FF3000]">
                  Open the book page
                </a>
              </p>
            ) : (
              <p className="mt-3 text-xs text-black opacity-70">Opens the payment page on PayPal in a new window.</p>
            )}
          </div>
        </div>

        {!busy && !blocked && (
          <div className="border-t-4 border-black px-5 py-3 sm:px-6">
            <p className="text-xs text-black">
              This window closes by itself in <span data-testid="book-popup-remaining">{remaining}</span> s
            </p>
            <div className="mt-2 h-2 border-2 border-black" aria-hidden="true">
              <div className="h-full bg-black transition-[width] duration-1000 ease-linear" style={{ width: `${share}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
