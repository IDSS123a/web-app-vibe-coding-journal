import { type NextRequest, NextResponse } from "next/server";

// Middleware for protecting dashboard routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/archive", "/bookmarks", "/admin"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    // TODO: Add actual session/auth check when auth is implemented
    // For now, middleware is a placeholder for future protection logic
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
