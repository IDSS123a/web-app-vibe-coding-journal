/**
 * Cron endpoint: /api/cron/health-check (PDL-081). A daily watchdog: it looks at the newest Daily Report, at how many articles were
 * collected in the last 24 hours and at payment events that need a person, and e-mails the admin ONLY when something is wrong.
 * Silence means healthy. Security: requires the CRON_SECRET header, like every other cron route (E-6 step 1).
 * Response: { healthy: boolean, problems: [...] }
 */
import { NextRequest, NextResponse } from "next/server";
import { isValidCronSecret } from "@/lib/cron/auth";
import { supabaseAdmin } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/resend";
import { evaluateHealth } from "@/features/health/domain";

export async function POST(request: NextRequest) {
  try {
    if (!isValidCronSecret(request.headers.get("authorization"))) {
      console.error("[HEALTH_CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!supabaseAdmin) throw new Error("Admin client not available");

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();
    const [report, articles, payments] = await Promise.all([
      supabaseAdmin.from("daily_reports").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("articles").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("payment_events").select("id", { count: "exact", head: true }).eq("status", "ambiguous").gte("created_at", since),
    ]);
    const failed = report.error ?? articles.error ?? payments.error;
    if (failed) throw new Error(`Health data unavailable: ${failed.message}`);

    const problems = evaluateHealth({
      now,
      latestReportAt: report.data?.updated_at ? new Date(report.data.updated_at as string) : null,
      articlesLast24h: articles.count ?? 0,
      ambiguousPaymentsLast24h: payments.count ?? 0,
    });

    if (problems.length > 0) {
      console.error(`[HEALTH_CRON] ${problems.length} problem(s): ${problems.map((p) => p.code).join(", ")}`);
      await sendAdminNotification({
        subject: `Health check: ${problems.length} problem${problems.length === 1 ? "" : "s"}`,
        html: `<h2>Vibe-Coding Journal health check</h2><ul>${problems.map((p) => `<li>${p.message}</li>`).join("")}</ul><p>This e-mail is sent only when something needs attention.</p>`,
      });
    }

    return NextResponse.json({ healthy: problems.length === 0, problems });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[HEALTH_CRON] failed: ${message}`);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
