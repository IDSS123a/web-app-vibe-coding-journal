/**
 * GET /api/account/export: a full copy of the caller's own data as a JSON download (GDPR access and portability, PDL-079).
 * Any signed-in person, whatever their plan, including a blocked or ended one: the right does not depend on payment.
 * Errors: 401, 500. E-6 five-step.
 */
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/verify-token";
import { exportUserData } from "@/features/account/repository";

export async function GET(request: NextRequest) {
  try {
    // 1+2. AUTHENTICATE (everyone signed in may export their own data)
    const user = await getVerifiedUser(request.headers.get("authorization"));
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 4. EXECUTE
    const data = await exportUserData(user.sub, user.email);

    // 5. RETURN
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="vibe-coding-journal-my-data.json"',
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ACCOUNT] export failed: ${message}`);
    return NextResponse.json({ error: "Failed to export your data" }, { status: 500 });
  }
}
