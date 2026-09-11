/**
 * DELETE /api/bookmarks/[articleId] — remove a bookmark for the caller.
 * Role required: any authenticated user (own bookmarks only -- articleId
 * is scoped by user.sub inside removeBookmark, never trusted alone).
 * Response: { success: true } even if the bookmark didn't exist -- the
 * end state the caller wants ("not bookmarked") is achieved either way.
 * E-6 five-step: authenticate → authorize → validate → execute → return.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { removeBookmark } from "@/features/bookmarks/repository";

const paramsSchema = z.object({ articleId: z.string().uuid() });

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> },
) {
  const raw = await params;
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. AUTHORIZE (a user may only ever remove their own bookmark --
    // enforced by scoping the delete to user.sub, never trusting the URL
    // param as a cross-user identifier)

    // 3. VALIDATE
    const parsed = paramsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid articleId" }, { status: 400 });
    }

    // 4. EXECUTE
    await removeBookmark(user.sub, parsed.data.articleId);

    // 5. RETURN
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[BOOKMARKS] remove failed: ${message}`);
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
