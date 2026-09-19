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

  // /dashboard, /archive and /bookmarks are PAID content (Director,
  // 2026-09-19: no payment -> no access; $10 Basic -> Daily Report, Archive,
  // Bookmarks; $50 Premium -> everything incl. University + Assistant).
  // They used to be public: /archive had no guard and /dashboard was guarded
  // only in the browser, so the article text was in the page source for any
  // visitor (PDL-026 open item, proven by curl 2026-09-19). Because this
  // middleware cannot see the browser-held session, enforcement is in the
  // data path instead: these pages are rendered client-side from
  // /api/reports/* and /api/bookmarks, which verify the token and the
  // subscription server-side (features/daily-report/access.ts). The
  // server-rendered shell of these pages contains no report data.
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
