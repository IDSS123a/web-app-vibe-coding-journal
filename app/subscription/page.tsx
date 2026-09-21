import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Subscription and renewal | Vibe-Coding Journal",
  description: "How Vibe-Coding Journal plans, prices, renewal and the Basic to Premium upgrade work.",
  alternates: { canonical: "/subscription" },
};

export default function Page() {
  return <LegalPage path="/subscription" />;
}
