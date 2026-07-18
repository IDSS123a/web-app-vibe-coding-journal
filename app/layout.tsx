import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe-Coding Journal — Daily Intelligence Digest",
  description: "Automated daily intelligence digest for vibe-coders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
