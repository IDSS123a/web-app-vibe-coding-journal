/**
 * DELETE /api/account: the signed-in person deletes their own account (GDPR erasure, PDL-079).
 * Body: { confirm: "DELETE MY ACCOUNT" }
 * Response: { success: true }
 * Errors: 401, 403 (an admin account cannot be deleted here), 422 (the confirmation was not typed exactly), 500.
 * The sign-in account is deleted and everything the person owns cascades away; payment records stay but lose the link to the
 * person (migration 036). E-6 five-step.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { deleteUserAccount } from "@/features/account/repository";
import { ACCOUNT_DELETE_CONFIRMATION } from "@/features/account/domain";

const bodySchema = z.object({ confirm: z.literal(ACCOUNT_DELETE_CONFIRMATION) });

export async function DELETE(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. AUTHORIZE: any signed-in person may delete their own account, but an admin account is the only way in to the admin area
    if (user.isAdmin) return NextResponse.json({ error: "An admin account cannot be deleted here" }, { status: 403 });

    // 3. VALIDATE
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: `Type ${ACCOUNT_DELETE_CONFIRMATION} to confirm` }, { status: 422 });

    // 4. EXECUTE
    await deleteUserAccount(user.sub);
    console.log(`[ACCOUNT] account ${user.sub} deleted by its owner`);

    // 5. RETURN
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ACCOUNT] delete failed: ${message}`);
    return NextResponse.json({ error: "Failed to delete the account" }, { status: 500 });
  }
}
