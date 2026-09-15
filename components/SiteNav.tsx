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
 */

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

  // The admin section has its own nav (app/admin/layout.tsx) -- avoid
  // stacking two navigation bars on top of each other there.
  if (pathname?.startsWith("/admin")) return null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

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
          <div className="flex items-center gap-4 overflow-x-auto text-xs font-bold uppercase tracking-widest">
            {token ? (
              <>
                {LOGGED_IN_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`shrink-0 underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000] ${
                      pathname === link.href ? "text-[#FF3000]" : "text-black"
                    }`}
                  >
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
                <a
                  href="/login"
                  className="shrink-0 text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
                >
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
        )}
      </nav>
    </header>
  );
}
