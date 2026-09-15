"use client";

/**
 * Site-wide navigation (Director's request, 2026-09-15: "postavi
 * lagano kretanje kroz cijelu web app" — smooth navigation across the
 * whole app). Before this, every page had its own scattered footer
 * links with no consistent way to move between sections, and there
 * was no sign-out control anywhere in the app at all — found while
 * building this. Rendered once in the root layout (app/layout.tsx),
 * so it's present on every page, admin section excluded (it already
 * has its own nav, app/admin/layout.tsx).
 *
 * Mobile nav added 2026-09-16 (P-21 UI/UX pass): the original single
 * horizontal row used `overflow-x-auto` with no visible scroll
 * affordance to fit on narrow screens — found live on a 375px viewport
 * that this silently hid University, Dictionary, and Sign Out off the
 * right edge with nothing indicating they were still there. University
 * is the app's largest feature; this wasn't a cosmetic gap. Replaced
 * with a real hamburger toggle below the `md` breakpoint, matching the
 * desktop row exactly above it — same links, same order, same Swiss
 * styling, just a different layout for the width available.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { supabase } from "@/lib/db/client";

const LOGGED_IN_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/archive", label: "Archive" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/university", label: "University" },
  { href: "/dictionary", label: "Dictionary" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { token, loading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // The admin section has its own nav (app/admin/layout.tsx) -- avoid
  // stacking two navigation bars on top of each other there.
  if (pathname?.startsWith("/admin")) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const linkClass = (href: string) =>
    `shrink-0 underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000] ${
      pathname === href ? "text-[#FF3000]" : "text-black"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b-4 border-black bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-12">
        <a
          href="/"
          className="text-sm font-black uppercase tracking-tighter text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          Vibe-Coding Journal
        </a>

        {!loading && (
          <>
            {/* Desktop / tablet: full horizontal row, unchanged. */}
            <div className="hidden items-center gap-4 text-xs font-bold uppercase tracking-widest md:flex">
              {token ? (
                <>
                  {LOGGED_IN_LINKS.map((link) => (
                    <a key={link.href} href={link.href} className={linkClass(link.href)}>
                      {link.label}
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="shrink-0 border-2 border-black px-3 py-1 text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="shrink-0 text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
                    Sign In
                  </a>
                  <a
                    href="/register"
                    className="shrink-0 border-2 border-black px-3 py-1 text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000]"
                  >
                    Register
                  </a>
                </>
              )}
            </div>

            {/* Mobile: hamburger toggle, same links stacked in a dropdown. */}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000] md:hidden"
            >
              {mobileOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
                  <path d="M0 1H18M0 7H18M0 13H18" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
          </>
        )}
      </nav>

      {!loading && mobileOpen && (
        <div className="border-t-4 border-black bg-white md:hidden">
          <div className="flex flex-col text-xs font-bold uppercase tracking-widest">
            {token ? (
              <>
                {LOGGED_IN_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`border-b-2 border-black px-4 py-4 transition-colors duration-150 ease-out hover:bg-[#F2F2F2] ${
                      pathname === link.href ? "text-[#FF3000]" : "text-black"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-4 text-left text-black transition-colors duration-150 ease-out hover:bg-[#F2F2F2] hover:text-[#FF3000]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="border-b-2 border-black px-4 py-4 text-black transition-colors duration-150 ease-out hover:bg-[#F2F2F2] hover:text-[#FF3000]"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-4 text-black transition-colors duration-150 ease-out hover:bg-[#F2F2F2] hover:text-[#FF3000]"
                >
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
