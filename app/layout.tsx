import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono, Inter, Source_Serif_4, Unbounded } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { HideOnAdmin } from "@/components/HideOnAdmin";
import { CookieNotice } from "@/components/legal/CookieNotice";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { RewardsProvider } from "@/components/rewards/RewardsProvider";

// KANON typography (PDL-074, specs/kanon-redesign/): five families, one role each. All five are variable
// fonts, so a single file per family covers every weight the spec lists (Inter 400-900, Source Serif 4
// 400-700, Unbounded 400-800, Figtree 400-800, Geist Mono 400-600) and the roles are mapped to the tokens
// --font-sans / --font-serif / --font-display / --font-ui / --font-mono in app/globals.css.
// Inter also carries Greek, because the Prompt School title includes a Greek word.
const inter = Inter({ subsets: ["latin", "latin-ext", "greek", "greek-ext"], variable: "--font-inter", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-source-serif", display: "swap" });
const unbounded = Unbounded({ subsets: ["latin", "latin-ext"], variable: "--font-unbounded", display: "swap" });
const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

// viewport-fit=cover lets the layout use the full screen on notched phones; the shell then pads itself with
// env(safe-area-inset-*) (see the .safe-* utilities in globals.css).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Vibe-Coding Journal, Daily Intelligence Digest",
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  // Set from the Studio's identity in lib/site.ts; the share picture is app/opengraph-image.tsx.
  openGraph: { type: "website", siteName: SITE_NAME, title: "Vibe-Coding Journal, Daily Intelligence Digest", description: SITE_TAGLINE, url: SITE_URL },
  twitter: { card: "summary_large_image", title: "Vibe-Coding Journal, Daily Intelligence Digest", description: SITE_TAGLINE },
  // Icons come from the Next.js file conventions in app/ (icon.png,
  // apple-icon.png, favicon.ico), which Next links into <head> automatically.
  // Until 2026-09-19 only public/favicon.png existed -- a 640x640 / 107 KB image
  // nothing in <head> pointed at -- so browsers asked for /favicon.ico, got a 404
  // and showed no tab icon (D1). public/favicon.png stays: the Mascot component
  // renders it in-page.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} ${unbounded.variable} ${figtree.variable} ${geistMono.variable}`}>
      <body>
        <RewardsProvider>
          <SiteNav />
          {children}
          <HideOnAdmin>
            <SiteFooter />
          </HideOnAdmin>
          <CookieNotice />
        </RewardsProvider>
      </body>
    </html>
  );
}
