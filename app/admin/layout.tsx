/**
 * Admin Layout
 * Protected: Admin role required
 */

import type { ReactNode } from "react";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black uppercase tracking-tighter text-black">
              Admin
            </h1>
            <nav className="flex gap-6 text-xs font-bold uppercase tracking-widest">
              <a
                href="/admin/review-queue"
                className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Review Queue
              </a>
              <a
                href="/admin/payments"
                className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Payments
              </a>
              <a
                href="/admin/university"
                className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                University
              </a>
              <a
                href="/admin/hold-gate-calibration"
                className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Hold-Gate Calibration
              </a>
              <a
                href="/dashboard"
                className="text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content — role-gated at the UI level (client session is not
          visible to server middleware); admin API routes re-check independently */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
