import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy | Vibe-Coding Journal",
  description: "A 14 day money back guarantee on every payment for Vibe-Coding Journal.",
  alternates: { canonical: "/refunds" },
};

export default function Page() {
  return <LegalPage path="/refunds" />;
}
