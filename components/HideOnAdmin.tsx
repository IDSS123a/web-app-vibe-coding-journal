"use client";

/**
 * Hides what it wraps on the admin pages (the admin area is its own dark console with its own header, and the public footer
 * with the legal links would sit under it as a white strip). The wrapped part is still rendered on the server, so it costs the
 * browser nothing extra; only whether to show it is decided here.
 */
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin") ? null : <>{children}</>;
}
