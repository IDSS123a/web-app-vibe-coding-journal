/**
 * Admin API: POST /api/admin/university/[lessonId]/review
 * Approve (publish) or reject (revert to stub) an AI-generated lesson.
 * Body: { decision: "published" | "stub" }
 * Auth: Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/client";
import { verifyAdminToken } from "@/lib/auth/verify-token";
import { reviewLesson } from "@/features/university/repository";
import { addTerm } from "@/features/dictionary/repository";

const reviewInputSchema = z.object({
  decision: z.enum(["published", "stub"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const admin = await verifyAdminToken(request.headers.get("authorization"));
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = reviewInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Read candidate terms from the lesson row itself (server-side
    // source of truth, set by the generation cron) rather than trusting
    // client-submitted term/definition text — approving a lesson must
    // only ever add the terms THAT lesson actually proposed.
    if (parsed.data.decision === "published") {
      if (!supabaseAdmin) throw new Error("Admin client not available");
      const { data: lesson, error: fetchError } = await supabaseAdmin
        .from("lessons")
        .select("candidate_terms")
        .eq("id", lessonId)
        .single();
      if (fetchError) throw new Error(`Failed to fetch lesson for term approval: ${fetchError.message}`);

      const candidateTerms = (lesson?.candidate_terms ?? []) as Array<{ term: string; definition: string }>;
      for (const t of candidateTerms) {
        await addTerm(t.term, t.definition, lessonId);
      }
    }

    await reviewLesson(lessonId, parsed.data.decision, admin.sub);

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ADMIN] Error reviewing lesson: ${errorMsg}`);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
