import { type NextRequest, NextResponse } from "next/server";

// Middleware for protecting dashboard and admin routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes require admin role
  if (pathname.startsWith("/admin")) {
    // E-4: Security check via Bearer token (from Authorization header or cookie)
    // TODO: Extract session from Supabase auth cookie if available
    // For now, rely on API endpoint auth checks
    // Production should check: cookie with session JWT → decode → verify admin role
    // If not admin, redirect to /

    return NextResponse.next();
  }

  // Dashboard routes require authentication
  const protectedRoutes = ["/dashboard", "/archive", "/bookmarks"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    // TODO: Add session check when auth is fully integrated
    // For now, allow all requests - rely on RLS at database level
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
