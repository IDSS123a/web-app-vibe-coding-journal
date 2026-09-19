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
 *
 * Breakpoint moved md (768) -> lg (1024) on 2026-09-19 (stress test D4):
 * the audit showed the full desktop row needs ~930 px, so at tablet
 * width (768) and phone-landscape (812) it overflowed the viewport, squeezed
 * the logo onto three lines and pushed Sign Out off-screen. Below 1024 px
 * the hamburger is used. Hamburger and logo tap targets are now >= 44 px.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { supabase } from "@/lib/db/client";
import { CoinBalance } from "@/components/rewards/CoinBalance";

const LOGGED_IN_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/archive", label: "Archive" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/university", label: "University" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/assistant", label: "Assistant" },
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
    `inline-flex min-h-11 shrink-0 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000] ${
      pathname === href ? "text-[#FF3000]" : "text-black"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b-4 border-black bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-12">
        <a
          href="/"
          className="flex min-h-11 items-center text-sm font-black uppercase tracking-tighter text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
        >
          Vibe-Coding Journal
        </a>

        {!loading && (
          <>
            {/* Desktop / tablet: full horizontal row, unchanged. */}
            <div className="hidden items-center gap-4 text-xs font-bold uppercase tracking-widest lg:flex">
              {token ? (
                <>
                  {LOGGED_IN_LINKS.map((link) => (
                    <a key={link.href} href={link.href} className={linkClass(link.href)}>
                      {link.label}
                    </a>
                  ))}
                  <CoinBalance />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex min-h-11 shrink-0 items-center border-2 border-black px-3 py-1 text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="inline-flex min-h-11 shrink-0 items-center text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
                    Sign In
                  </a>
                  <a
                    href="/register"
                    className="inline-flex min-h-11 shrink-0 items-center border-2 border-black px-3 py-1 text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000]"
                  >
                    Register
                  </a>
                </>
              )}
            </div>

            {/* Mobile: coin balance stays visible next to the hamburger; full detail lives behind CoinBalance's own click-to-expand. */}
            <div className="flex items-center gap-2 lg:hidden">
              {token && <CoinBalance variant="compact" />}
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:text-[#FF3000]"
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
            </div>
          </>
        )}
      </nav>

      {!loading && mobileOpen && (
        <div className="border-t-4 border-black bg-white lg:hidden">
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
