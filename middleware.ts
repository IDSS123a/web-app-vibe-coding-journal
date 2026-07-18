import { type NextRequest, NextResponse } from "next/server";

// Middleware for protecting dashboard and admin routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // NOTE on /admin: the Supabase session lives in the browser (localStorage via
  // supabase-js), so this server middleware cannot read it without migrating to
  // cookie-based SSR sessions. The admin area is therefore guarded at two layers
  // that CAN see the token:
  //   1. UI: components/AdminGuard (wraps app/admin/layout) → non-admins get a
  //      "Not authorized" screen, never the admin content.
  //   2. API: every /api/admin/* route re-verifies the admin role server-side.
  // If we later adopt @supabase/ssr cookie sessions, add the redirect here too.

  // Dashboard routes require authentication (enforced by RLS + page-level session
  // checks today; see the SSR note above for a future middleware-level guard).
  const protectedRoutes = ["/dashboard", "/archive", "/bookmarks"];
  void protectedRoutes.some((route) => pathname.startsWith(route));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
