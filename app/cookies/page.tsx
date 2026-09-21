import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie notice | Vibe-Coding Journal",
  description: "What Vibe-Coding Journal stores on your device: only what is needed to work, no tracking.",
  alternates: { canonical: "/cookies" },
};

export default function Page() {
  return <LegalPage path="/cookies" />;
}
