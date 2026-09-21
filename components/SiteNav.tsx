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
 *
 * Breakpoint moved lg (1024) -> xl (1280) on 2026-09-20 when the seventh link (Prompt School) joined:
 * seven links need about 1100 px, so the hamburger now covers everything below 1280 px.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
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
  { href: "/prompt-school", label: "Prompt School" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { token, loading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // An admin needs a way back into the admin area from the rest of the site (found 2026-09-22: once an admin opened the dashboard
  // there was no link back). The server says who is an admin; nothing here is a permission, the admin pages and API check again.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (loading || !token) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    fetch("/api/me", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => {
        if (active) setIsAdmin(Boolean(d.isAdmin));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token, loading]);
  const links = isAdmin ? [...LOGGED_IN_LINKS, { href: "/admin/users", label: "Admin" }] : LOGGED_IN_LINKS;

  // The admin section has its own nav (app/admin/layout.tsx) -- avoid
  // stacking two navigation bars on top of each other there.
  if (pathname?.startsWith("/admin")) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const linkClass = (href: string) =>
    `k-nav-link inline-flex min-h-11 shrink-0 items-center underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal ${
      pathname === href ? "text-signal" : "text-black"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-black bg-white pt-[env(safe-area-inset-top)]">
      <nav className="flex w-full items-center justify-between px-4 py-2 md:px-12">
        <Link
          href="/"
          className="flex min-h-11 items-center font-extrabold tracking-[-0.02em] text-black transition-colors duration-150 ease-out hover:text-signal"
        >
          Vibe-Coding Journal
        </Link>

        {!loading && (
          <>
            {/* Desktop / tablet: full horizontal row, unchanged. */}
            <div className="hidden items-center gap-4 xl:flex">
              {token ? (
                <>
                  {links.map((link) => (
                    <a key={link.href} href={link.href} className={linkClass(link.href)}>
                      {link.label}
                    </a>
                  ))}
                  <CoinBalance />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="k-btn shrink-0 px-3 py-1 text-xs"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="k-nav-link inline-flex min-h-11 shrink-0 items-center text-black underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal">
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="k-btn shrink-0 px-3 py-1 text-xs"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: coin balance stays visible next to the hamburger; full detail lives behind CoinBalance's own click-to-expand. */}
            <div className="flex items-center gap-2 xl:hidden">
              {token && <CoinBalance variant="compact" />}
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-black text-black transition-colors duration-150 ease-out hover:border-signal hover:text-signal"
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
        <div className="border-t border-black bg-white xl:hidden">
          <div className="k-nav-link flex flex-col text-sm">
            {token ? (
              <>
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`border-b border-black px-4 py-4 transition-colors duration-150 ease-out hover:bg-paper-2 ${
                      pathname === link.href ? "text-signal" : "text-black"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-4 text-left text-black transition-colors duration-150 ease-out hover:bg-paper-2 hover:text-signal"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-black px-4 py-4 text-black transition-colors duration-150 ease-out hover:bg-paper-2 hover:text-signal"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-4 text-black transition-colors duration-150 ease-out hover:bg-paper-2 hover:text-signal"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
