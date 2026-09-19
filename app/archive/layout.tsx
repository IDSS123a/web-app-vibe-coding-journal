/**
 * Archive Layout
 * Protected: active subscription or trial required (P-13). This guard is the
 * user-facing half (paywall screen, sign-in prompt); the enforcement that
 * actually keeps the content from unpaid callers is server-side, in the
 * /api/reports routes the archive pages render from
 * (features/daily-report/access.ts). /archive used to have no guard at all.
 */

import type { ReactNode } from "react";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
