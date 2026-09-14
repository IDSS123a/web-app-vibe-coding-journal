import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// P-20 (CONSTITUTION.md) / DESIGN_NOTES.md: Swiss International style
// specifies Inter as the grotesque sans-serif, weights 400-900.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vibe-Coding Journal — Daily Intelligence Digest",
  description: "Automated daily intelligence digest for vibe-coders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
