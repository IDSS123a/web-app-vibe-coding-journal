"use client";

/**
 * Scan mode of the Daily Report (PDL-082, the KANON Console layer). The same articles as the reading view, as a dense table a
 * reader can run an eye down in a minute: number, headline, category, source, worth trying and confidence. A row opens to the
 * summary, why it matters and what to watch. Two filters: worth trying only, and a category. It only changes how the report is
 * laid out; it shows nothing the reading view does not.
 */

import { useMemo, useState } from "react";
import type { Article } from "@/lib/validation/schemas";

const WORTH = { yes: "Yes", maybe: "Maybe", no: "No" } as const;

export function ArticleScan({ articles }: { articles: Article[] }) {
  const [onlyWorth, setOnlyWorth] = useState(false);
  const [category, setCategory] = useState("");

  const categories = useMemo(() => Array.from(new Set(articles.map((a) => a.category).filter((c): c is string => Boolean(c)))).sort(), [articles]);
  const rows = useMemo(
    () => articles.map((a, i) => ({ a, n: i + 1 })).filter(({ a }) => (!onlyWorth || a.worth_trying === "yes") && (!category || a.category === category)),
    [articles, onlyWorth, category],
  );

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center border px-3 font-mono text-xs transition-colors duration-150 ease-out ${
      active ? "border-console-amber bg-console-panel-2 text-console-amber" : "border-console-line text-console-text hover:border-console-ice"
    }`;

  return (
    <div className="layer-console mt-6 border border-console-line p-3 sm:p-5" data-testid="scan-view">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={onlyWorth} onClick={() => setOnlyWorth((v) => !v)} className={chip(onlyWorth)}>
          Worth trying only
        </button>
        <label className="sr-only" htmlFor="scan-category">Category</label>
        <select
          id="scan-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-11 border border-console-line bg-console-panel px-3 font-mono text-xs text-console-text"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <p className="ml-auto font-mono text-xs text-console-dim">{rows.length} of {articles.length}</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center font-mono text-xs text-console-dim">Nothing matches these filters.</p>
      ) : (
        <ul className="divide-y divide-console-line border-y border-console-line">
          {rows.map(({ a, n }) => (
            <li key={a.id}>
              <details className="group">
                <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[2rem_1fr] items-start gap-x-3 gap-y-1 py-3 hover:bg-console-panel md:grid-cols-[2rem_1fr_9rem_9rem_5rem_4rem]">
                  <span className="font-mono text-xs text-console-dim">{String(n).padStart(2, "0")}</span>
                  <span className="break-words text-sm font-semibold text-console-text">{a.title}</span>
                  <span className="col-start-2 font-mono text-xs text-console-ice md:col-start-auto">{a.category ?? ""}</span>
                  <span className="col-start-2 font-mono text-xs text-console-dim md:col-start-auto">{a.source}</span>
                  <span className={`col-start-2 font-mono text-xs md:col-start-auto ${a.worth_trying === "yes" ? "text-console-amber" : "text-console-dim"}`}>
                    {a.worth_trying ? `Try: ${WORTH[a.worth_trying]}` : ""}
                  </span>
                  <span className="col-start-2 font-mono text-xs text-console-dim md:col-start-auto">
                    {a.confidence_score != null ? `${Math.round(a.confidence_score * 100)}%` : ""}
                  </span>
                </summary>
                <div className="grid gap-3 pb-4 pl-11 pr-2 text-sm leading-relaxed text-console-text">
                  {(a.summary || a.raw_summary) && <p>{a.summary || a.raw_summary}</p>}
                  {a.why_it_matters && (
                    <p>
                      <span className="font-mono text-xs text-console-amber">Why it matters: </span>
                      {a.why_it_matters}
                      {a.who_it_affects ? ` (${a.who_it_affects})` : ""}
                    </p>
                  )}
                  {a.what_to_watch && (
                    <p>
                      <span className="font-mono text-xs text-console-amber">What to watch: </span>
                      {a.what_to_watch}
                    </p>
                  )}
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-mono text-xs text-console-ice underline decoration-1 underline-offset-4">
                    Open the source
                  </a>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
