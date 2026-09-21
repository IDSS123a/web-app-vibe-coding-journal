"use client";

/**
 * The cookie notice (PDL-079). The app stores only what it needs to work (the sign-in session and a pop-up timer) and uses no
 * tracking or advertising, so this is an information notice with one button, not a consent form. Whether the reader has seen it
 * is remembered in local storage; if storage is unavailable the notice simply shows again.
 */
import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "vbj-cookie-notice-seen";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Not remembered; the notice shows again next time, which is harmless.
    }
  }

  if (!visible) return null;
  return (
    <section
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-50 border-2 border-black bg-white p-4 text-black sm:right-auto sm:max-w-md"
    >
      <p className="text-sm leading-relaxed">
        This site stores only what it needs to work, such as keeping you signed in. It uses no advertising or tracking cookies.{" "}
        <Link href="/cookies" className="underline decoration-1 underline-offset-2 hover:text-signal">
          Details
        </Link>
        .
      </p>
      <button type="button" onClick={dismiss} className="mt-3 inline-flex min-h-11 items-center justify-center border-2 border-black bg-black px-5 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-signal hover:bg-signal">
        Got it
      </button>
    </section>
  );
}
