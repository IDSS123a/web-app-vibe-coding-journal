import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteCredit } from "@/components/SiteCredit";
import { RewardsProvider } from "@/components/rewards/RewardsProvider";

// P-20 (CONSTITUTION.md) / DESIGN_NOTES.md: Swiss International style
// specifies Inter as the grotesque sans-serif, weights 400-900.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vibe-Coding Journal, Daily Intelligence Digest",
  description: "Automated daily intelligence digest for vibe-coders",
  // Icons come from the Next.js file conventions in app/ (icon.png,
  // apple-icon.png, favicon.ico), which Next links into <head> automatically.
  // Until 2026-09-19 only public/favicon.png existed -- a 640x640 / 107 KB image
  // nothing in <head> pointed at -- so browsers asked for /favicon.ico, got a 404
  // and showed no tab icon (D1). public/favicon.png stays: the Mascot and
  // SiteCredit components render it in-page.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <RewardsProvider>
          <SiteNav />
          {children}
          <SiteCredit />
        </RewardsProvider>
      </body>
    </html>
  );
}
