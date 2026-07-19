import type { DailyReport } from "@/lib/validation/schemas";
import { formatPublicTimestamp } from "@/lib/time/format-public-timestamp";

/**
 * Dashboard — empty-state Daily Report page
 * P-1.3: No report should look "broken" even with no data.
 * This sprint proves the Presentation layer renders DailyReport schema
 * correctly with seed/placeholder content. Real pipeline comes Sprint 2+.
 */

const SEED_DAILY_REPORT: DailyReport = {
  id: "seed-001",
  date: new Date().toISOString().split("T")[0]!,
  markdown: `
# Najvažnije
*No articles today — check back tomorrow.*

## Trendovi
*No trending topics at this time.*

## Novi alati
*Awaiting new tool releases.*

## Research
*No research papers today.*

## GitHub
*No GitHub updates at this time.*

## Šta testirati danas
*Explore yesterday's report or check back tomorrow for new recommendations.*
`.trim(),
  reading_time_minutes: 0,
  article_count: 0,
  sections: ["Najvažnije", "Trendovi", "Novi alati", "Research", "GitHub", "Šta testirati danas"],
  review_status: "auto_published",
  approved_by: null,
  approved_at: null,
  rejected_by: null,
  rejected_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Vibe-Coding Journal</h1>
          <p className="text-gray-600">Automated daily intelligence digest for vibe-coders</p>
        </div>

        {/* Daily Report Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {/* Meta info */}
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <p className="text-sm text-gray-600">
                {new Date(SEED_DAILY_REPORT.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-500">
                {SEED_DAILY_REPORT.article_count} articles •{" "}
                {SEED_DAILY_REPORT.reading_time_minutes || "< 1"} min read
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Updated {formatPublicTimestamp(SEED_DAILY_REPORT.updated_at)}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {SEED_DAILY_REPORT.review_status === "auto_published" && "Auto-published"}
                {SEED_DAILY_REPORT.review_status === "held_for_review" && "Awaiting review"}
                {SEED_DAILY_REPORT.review_status === "manually_approved" && "Approved"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-center italic text-gray-500">
              This is an empty-state Daily Report. The pipeline will populate this with real
              content once the Source Collector, Duplicate Engine, and Quality Engine are
              implemented (Sprint 2+).
            </p>
          </div>

          {/* Raw markdown (for display) */}
          <div className="mt-6 whitespace-pre-wrap rounded bg-gray-100 p-4 font-mono text-sm text-gray-700">
            {SEED_DAILY_REPORT.markdown}
          </div>

          {/* Sections */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="mb-3 font-semibold">Sections</h3>
            <div className="flex flex-wrap gap-2">
              {SEED_DAILY_REPORT.sections.map((section) => (
                <span
                  key={section}
                  className="inline-block rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  {section}
                </span>
              ))}
            </div>
          </div>

          {/* Schema validation feedback */}
          <div className="mt-6 rounded-lg border-l-4 border-green-400 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              <strong>Schema validation:</strong> DailyReport renders correctly with all required
              fields (P-4). Review status = {SEED_DAILY_REPORT.review_status}.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 space-y-2 text-center">
          <p className="text-sm text-gray-600">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              ← Home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
