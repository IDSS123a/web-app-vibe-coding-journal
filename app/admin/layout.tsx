/**
 * Admin Layout
 * Protected: Admin role required
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-black uppercase tracking-tighter text-black">
              Admin
            </h1>
            <nav className="flex flex-wrap gap-x-5 gap-y-0 text-xs font-bold uppercase tracking-widest">
              <Link
                href="/admin/users"
                className="inline-flex min-h-11 items-center text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Users
              </Link>
              <Link
                href="/admin/review-queue"
                className="inline-flex min-h-11 items-center text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Review Queue
              </Link>
              <Link
                href="/admin/payments"
                className="inline-flex min-h-11 items-center text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Payments
              </Link>
              <Link
                href="/admin/university"
                className="inline-flex min-h-11 items-center text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                University
              </Link>
              <Link
                href="/admin/hold-gate-calibration"
                className="inline-flex min-h-11 items-center text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Hold-Gate Calibration
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
              >
                Dashboard
              </Link>
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
