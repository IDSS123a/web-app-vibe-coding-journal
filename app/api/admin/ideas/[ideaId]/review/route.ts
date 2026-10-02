/**
 * Admin API: POST /api/admin/ideas/[ideaId]/review
 * Approve (publish) or reject an AI-generated idea.
 * Body: { decision: "published" | "rejected" }
 * Auth: Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { reviewIdea } from "@/features/ideas/repository";

const reviewInputSchema = z.object({
  decision: z.enum(["published", "rejected"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> },
) {
  try {
    const admin = await verifyAdminToken(request.headers.get("authorization"));
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ideaId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = reviewInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await reviewIdea(ideaId, parsed.data.decision, admin.sub);

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error reviewing idea: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
