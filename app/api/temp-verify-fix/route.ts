import { NextResponse } from "next/server";
import { getArticlesForDailyReport } from "@/features/pipeline/repository";

export async function GET() {
  try {
    const articles = await getArticlesForDailyReport();
    return NextResponse.json({
      ok: true,
      count: articles.length,
      oldestCreatedAt: articles.length ? articles[articles.length - 1]!.created_at : null,
      newestCreatedAt: articles.length ? articles[0]!.created_at : null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
