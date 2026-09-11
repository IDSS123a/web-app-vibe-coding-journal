/**
 * Admin Layout
 * Protected: Admin role required
 */

import type { ReactNode } from "react";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Admin Dashboard
            </h1>
            <nav className="flex gap-4">
              <a
                href="/admin/review-queue"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
              >
                Review Queue
              </a>
              <a
                href="/admin/hold-gate-calibration"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
              >
                Hold-Gate Calibration
              </a>
              <a
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
              >
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content — role-gated at the UI level (client session is not
          visible to server middleware); admin API routes re-check independently */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
