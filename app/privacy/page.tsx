import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Vibe-Coding Journal",
  description: "What personal data Vibe-Coding Journal collects, why, who handles it, how long it is kept, and your GDPR rights.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <LegalPage path="/privacy" />;
}
