/**
 * GET /api/bookmarks — list the caller's bookmarked articles, newest first.
 * POST /api/bookmarks — bookmark an article. Body: { article_id: uuid }
 * Role required: any authenticated user (bookmarks are per-user, not
 * subscription-gated -- same access level as /api/me).
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { createBookmarkInputSchema } from "@/lib/validation/schemas";
import { addBookmark, getUserBookmarks } from "@/features/bookmarks/repository";

export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (any authenticated user may read their own bookmarks)
    // 3. VALIDATE (no request body)

    // 4. EXECUTE
    const bookmarks = await getUserBookmarks(user.sub);

    // 5. RETURN
    return NextResponse.json({ bookmarks });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[BOOKMARKS] list failed: ${message}`);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (any authenticated user may bookmark an article)

    // 3. VALIDATE
    const body = await request.json().catch(() => null);
    const parsed = createBookmarkInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid article_id" }, { status: 400 });
    }

    // 4. EXECUTE
    const bookmark = await addBookmark(user.sub, parsed.data.article_id);

    // 5. RETURN
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[BOOKMARKS] add failed: ${message}`);
    return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 });
  }
}
