/**
 * Admin Layout
 * Protected: Admin role required
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="layer-console min-h-dvh">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-console-line bg-console-panel">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="k-h3 text-console-text">
              Admin
            </h1>
            <nav className="flex flex-wrap gap-x-5 gap-y-0 k-label">
              <Link
                href="/admin/users"
                className="inline-flex min-h-11 items-center text-console-text underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal"
              >
                Users
              </Link>
              <Link
                href="/admin/review-queue"
                className="inline-flex min-h-11 items-center text-console-text underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal"
              >
                Review Queue
              </Link>
              <Link
                href="/admin/payments"
                className="inline-flex min-h-11 items-center text-console-text underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal"
              >
                Payments
              </Link>
              <Link
                href="/admin/ai-usage"
                className="inline-flex min-h-11 items-center text-console-text underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal"
              >
                AI Usage
              </Link>
              <Link
                href="/admin/university"
                className="inline-flex min-h-11 items-center text-console-text underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal"
              >
                University
              </Link>
              <Link
                href="/admin/hold-gate-calibration"
                className="inline-flex min-h-11 items-center text-console-text underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal"
              >
                Hold-Gate Calibration
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center text-console-text underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content — role-gated at the UI level (client session is not
          visible to server middleware); admin API routes re-check independently */}
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
