"use client";

/**
 * Cross-sell of the Director's book on the Prompt School pages (Director, 2026-09-20). The cover is a real
 * button: a click plays a short celebration (the cover jumps, confetti, and 25 coins the first time, once per
 * reader, through the existing rewards system) and then opens the book's PayPal payment page in a new window.
 *
 * The new window is opened at once, inside the click (browsers block a window opened later from a timer), and
 * pointed at PayPal after the celebration has had a moment. If the browser blocks it anyway, a plain link
 * appears. Nothing here touches payment details: the reader pays on PayPal's own page.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BOOK } from "@/lib/book";
import { useRewards } from "@/components/rewards/RewardsProvider";

const CELEBRATION_MS = 1600;

interface Props {
  /** "hero" is the large block on the overview, "compact" a slim one for chapter pages. */
  variant?: "hero" | "compact";
}

export function BookCrossSell({ variant = "hero" }: Props) {
  const { award, sparkle } = useRewards();
  const [jumping, setJumping] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  function openBook() {
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
    setBlocked(false);
    setJumping(true);
    sparkle();
    void award("book_discovery", BOOK.rewardDedupeKey);

    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 300 : CELEBRATION_MS;
    timers.current.push(
      window.setTimeout(() => setJumping(false), CELEBRATION_MS),
      window.setTimeout(() => {
        if (win && !win.closed) win.location.href = BOOK.payUrl;
        else setBlocked(true);
      }, delay),
    );
  }

  const cover = (
    <button
      type="button"
      onClick={openBook}
      aria-label={`Get the book ${BOOK.title} by ${BOOK.author}. Opens the payment page in a new window.`}
      className={`group relative block shrink-0 border-4 border-black bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] ${
        variant === "hero" ? "w-44 sm:w-52 md:w-60" : "w-20 sm:w-24"
      } ${jumping ? "book-jump" : "transition-transform duration-150 ease-out hover:-translate-y-1"}`}
    >
      <Image
        src={BOOK.coverSrc}
        alt={`Cover of the book ${BOOK.title}, ${BOOK.subtitle}, by ${BOOK.author}`}
        width={BOOK.coverWidth}
        height={BOOK.coverHeight}
        sizes={variant === "hero" ? "(min-width: 768px) 240px, 208px" : "96px"}
        priority={variant === "hero"}
        className="block h-auto w-full"
      />
    </button>
  );

  const actions = (
    <>
      <button
        type="button"
        onClick={openBook}
        className="inline-flex min-h-11 w-full items-center justify-center border-4 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3000] sm:w-auto"
      >
        Get the book →
      </button>
      {blocked && (
        <p role="status" className="mt-3 text-xs text-black">
          Your browser blocked the new window.{" "}
          <a href={BOOK.payUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-2 underline-offset-4 hover:text-[#FF3000]">
            Open the book page
          </a>
        </p>
      )}
    </>
  );

  if (variant === "compact") {
    return (
      <aside aria-label="The book behind this School" className="mt-10 flex items-center gap-4 border-4 border-black p-4">
        {cover}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF3000]">The book behind this School</p>
          <p className="mb-3 text-sm font-black uppercase leading-tight tracking-tight text-black">{BOOK.title}</p>
          {actions}
        </div>
      </aside>
    );
  }

  return (
    <aside aria-labelledby="book-heading" className="mb-12 border-4 border-black p-5 sm:p-6">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
        {cover}
        <div className="min-w-0 flex-1 text-center md:text-left">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">The book behind this School</p>
          <h2 id="book-heading" className="text-2xl font-black uppercase leading-tight tracking-tighter text-black md:text-3xl">
            {BOOK.title}
          </h2>
          <p className="mt-1 text-sm text-black">
            by {BOOK.author}, {BOOK.subtitle}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-black">
            Every chapter of this School is written from this book. Own the complete book: eleven chapters, a glossary,
            fifteen ready-made prompt blueprints, a Markdown manual, a techniques quick reference, further reading and a
            guide to prompting platforms and tools.
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-black">Tap the book for a small surprise</p>
          <div className="mt-4 flex flex-col items-center md:items-start">{actions}</div>
          <p className="mt-3 text-xs text-black opacity-70">Opens the payment page on PayPal in a new window.</p>
        </div>
      </div>
    </aside>
  );
}
