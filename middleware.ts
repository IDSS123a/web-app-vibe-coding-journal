import { type NextRequest, NextResponse } from "next/server";

// Middleware for protecting dashboard and admin routes
export function middleware(_request: NextRequest) {
  // NOTE on /admin: the Supabase session lives in the browser (localStorage via
  // supabase-js), so this server middleware cannot read it without migrating to
  // cookie-based SSR sessions. The admin area is therefore guarded at two layers
  // that CAN see the token:
  //   1. UI: components/AdminGuard (wraps app/admin/layout) → non-admins get a
  //      "Not authorized" screen, never the admin content.
  //   2. API: every /api/admin/* route re-verifies the admin role server-side.
  // If we later adopt @supabase/ssr cookie sessions, add the redirect here too.

  // /dashboard and /archive are intentionally PUBLIC today, same content
  // to every visitor whether signed in or not -- there is no paywall
  // enforcement anywhere in the app despite P-13's subscription/trial
  // data model existing at the DB layer (found live 2026-09-11; this
  // array used to list them as "protected" while doing nothing about
  // it -- `void protectedRoutes.some(...)`, dead code, removed). Whether
  // that's intentional (public content as a growth/marketing choice) or
  // an oversight is a product decision for the Director, not inferred
  // here (M-4) -- see DECISION_LOG.md / the corresponding HANDOFF note.
  //
  // /bookmarks IS effectively gated, but at the page/API level, not
  // here: the page (app/bookmarks/page.tsx) and every /api/bookmarks/*
  // route independently require a valid session (per-user data has no
  // meaningful anonymous view), the same two-layer pattern /admin uses.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
