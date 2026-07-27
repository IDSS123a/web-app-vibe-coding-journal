/**
 * Dashboard Layout
 * Protected: active subscription or trial required (P-13, Sprint 07)
 */

import type { ReactNode } from "react";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
