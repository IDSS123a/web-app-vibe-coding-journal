import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | Vibe-Coding Journal",
  description: "The terms for using Vibe-Coding Journal: plans, payment, acceptable use, content, liability.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <LegalPage path="/terms" />;
}
