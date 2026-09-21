/**
 * Vibe-Coding Dictionary. Premium only (PremiumGuard).
 *
 * Holds about 2,600 terms, so the page is built for finding, not reading top to bottom
 * (specs/knowledge-growth-and-dictionary/): instant search over names, abbreviations and
 * definitions; topic tiles with counts; an A to Z rail; a level filter; "new" and
 * "trending" markers fed by the daily articles; and a default view that leaves the deep
 * machine learning and infrastructure vocabulary behind one toggle (P-0). Everything is
 * filtered in the browser from one cached API response, and only 60 cards are drawn at a
 * time so a list of thousands never freezes a phone.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import type { PublicDictionaryTerm } from "@/lib/validation/schemas";
import {
  DICTIONARY_GROUPS,
  DICTIONARY_LEVELS,
  EMPTY_FILTERS,
  applyDictionaryFilters,
  facetCounts,
  isNewTerm,
  isTrendingTerm,
  type DictionaryFilters,
  type DictionaryLevel,
} from "@/features/dictionary/domain";

const PAGE_SIZE = 60;
const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
const GROUP_LABEL = Object.fromEntries(DICTIONARY_GROUPS.map((g) => [g.id, g.label]));

const chip = (active: boolean) =>
  `inline-flex min-h-11 items-center border-2 px-3 text-xs font-bold uppercase tracking-widest transition-colors duration-150 ease-out ${
    active ? "border-black bg-black text-white" : "border-black bg-white text-black hover:border-signal hover:text-signal"
  }`;

function TermCard({ term, now, onRelated }: { term: PublicDictionaryTerm; now: Date; onRelated: (name: string) => void }) {
  const isNew = isNewTerm(term, now);
  const trending = isTrendingTerm(term, now);
  return (
    <article className="border border-black p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="break-words text-black k-h4">{term.term}</h3>
        <div className="flex flex-wrap gap-2">
          {isNew && <span className="bg-signal py-0.5 text-[11px] k-btn">New</span>}
          {trending && <span className="py-0.5 text-[11px] text-signal k-btn">Trending</span>}
          {term.level && <span className="py-0.5 text-[11px] k-btn">{term.level}</span>}
          {term.tier === "adjacent" && <span className="bg-paper-2 py-0.5 text-[11px] k-btn">Adjacent</span>}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-black">{term.definition}</p>
      {term.aliases.length > 0 && <p className="mt-2 text-xs text-black/70">Also known as: {term.aliases.join(", ")}</p>}
      {term.category_group && <p className="mt-2 text-black/60 k-label">{GROUP_LABEL[term.category_group] ?? term.category_group}</p>}
      {term.related_terms.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-black/60 k-label">See also</span>
          {term.related_terms.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onRelated(name)}
              className="inline-flex min-h-11 items-center border border-black px-3 text-xs font-bold text-black transition-colors duration-150 ease-out hover:border-signal hover:text-signal"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function TermList() {
  const { token, loading: sessionLoading } = useSession();
  const [terms, setTerms] = useState<PublicDictionaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DictionaryFilters>(EMPTY_FILTERS);
  const [shown, setShown] = useState(PAGE_SIZE);
  const topRef = useRef<HTMLDivElement>(null);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetch("/api/dictionary", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { terms: PublicDictionaryTerm[] }) => setTerms(d.terms))
      .catch(() => setError("Failed to load the dictionary."))
      .finally(() => setLoading(false));
  }, [token, sessionLoading]);

  useEffect(() => setShown(PAGE_SIZE), [filters]);

  const set = (patch: Partial<DictionaryFilters>) => setFilters((f) => ({ ...f, ...patch }));

  // The set the tiles and the letter rail count from: every facet except the one being counted.
  const visibleForTiles = useMemo(
    () => applyDictionaryFilters(terms, { ...filters, group: null, letter: null }, now),
    [terms, filters, now],
  );
  const visibleForLetters = useMemo(() => applyDictionaryFilters(terms, { ...filters, letter: null }, now), [terms, filters, now]);
  const tileCounts = useMemo(() => facetCounts(visibleForTiles).groups, [visibleForTiles]);
  const letterCounts = useMemo(() => facetCounts(visibleForLetters).letters, [visibleForLetters]);
  const results = useMemo(() => applyDictionaryFilters(terms, filters, now), [terms, filters, now]);

  const unsorted = useMemo(() => terms.filter((t) => !t.category_group).length, [terms]);
  const hiddenAdjacent = useMemo(() => terms.filter((t) => t.tier === "adjacent").length, [terms]);
  const newCount = useMemo(() => terms.filter((t) => isNewTerm(t, now)).length, [terms, now]);
  const trendingCount = useMemo(() => terms.filter((t) => isTrendingTerm(t, now)).length, [terms, now]);

  const anyFacet = !!(filters.group || filters.level || filters.letter || filters.query.trim() || filters.onlyNew || filters.onlyTrending);
  const showTiles = !filters.query.trim() && !filters.group && !filters.onlyNew && !filters.onlyTrending;

  function goToRelated(name: string) {
    setFilters({ ...EMPTY_FILTERS, includeAdjacent: filters.includeAdjacent, query: name });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="k-page">
      <div ref={topRef} className="mx-auto max-w-4xl scroll-mt-24 xl:max-w-5xl">
        <div className="mb-8 border-b border-black pb-8">
          <p className="mb-2 text-signal k-label">Premium</p>
          <h1 className="text-black k-display">Vibe-Coding Dictionary</h1>
          <p className="mt-2 text-sm text-black">
            Plain-language definitions for the terms you meet in the University and the Daily Digest.
            {terms.length > 0 && ` ${terms.length.toLocaleString("en-US")} terms, growing as new ones appear in the market.`}
          </p>
        </div>

        <label className="sr-only" htmlFor="dictionary-search">
          Search the dictionary
        </label>
        <input
          id="dictionary-search"
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search terms and abbreviations"
          className="mb-4 h-12 w-full border-b border-black bg-white px-1 text-base text-black outline-none transition-colors duration-150 ease-out focus:border-signal"
        />

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p role="alert" className="border border-signal p-3 text-sm text-signal">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by level">
              <button type="button" aria-pressed={!filters.level} onClick={() => set({ level: null })} className={chip(!filters.level)}>
                All levels
              </button>
              {DICTIONARY_LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={filters.level === l.id}
                  onClick={() => set({ level: filters.level === l.id ? null : (l.id as DictionaryLevel) })}
                  className={chip(filters.level === l.id)}
                >
                  {l.label}
                </button>
              ))}
              {newCount > 0 && (
                <button type="button" aria-pressed={filters.onlyNew} onClick={() => set({ onlyNew: !filters.onlyNew })} className={chip(filters.onlyNew)}>
                  New ({newCount})
                </button>
              )}
              {trendingCount > 0 && (
                <button type="button" aria-pressed={filters.onlyTrending} onClick={() => set({ onlyTrending: !filters.onlyTrending })} className={chip(filters.onlyTrending)}>
                  Trending ({trendingCount})
                </button>
              )}
            </div>

            {hiddenAdjacent > 0 && (
              <label className="mb-6 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-black">
                <input
                  type="checkbox"
                  checked={filters.includeAdjacent}
                  onChange={(e) => set({ includeAdjacent: e.target.checked })}
                  className="h-5 w-5 shrink-0 accent-black"
                />
                Also show advanced and adjacent terms ({hiddenAdjacent.toLocaleString("en-US")}): deep machine learning, infrastructure internals, compliance
              </label>
            )}

            {showTiles && (
              <section aria-label="Browse by topic" className="mb-8">
                <h2 className="mb-3 text-signal k-h4">Browse by topic</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {DICTIONARY_GROUPS.filter((g) => (tileCounts[g.id] ?? 0) > 0).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => set({ group: g.id })}
                      className="flex min-h-11 items-center justify-between gap-3 border border-black p-3 text-left transition-colors duration-150 ease-out hover:border-signal hover:text-signal"
                    >
                      <span>
                        <span className="block text-black k-label">{g.label}</span>
                        <span className="mt-1 block text-xs text-black/70">{g.description}</span>
                      </span>
                      <span className="k-value shrink-0 text-base tabular-nums text-black">{tileCounts[g.id]}</span>
                    </button>
                  ))}
                </div>
                {unsorted > 0 && (
                  <p className="mt-3 text-xs text-black/70">
                    {unsorted.toLocaleString("en-US")} more terms are still being sorted into topics. Search and the A to Z list already include them.
                  </p>
                )}
              </section>
            )}

            {filters.group && (
              <div className="mb-4 flex flex-wrap items-center gap-3 border border-black bg-paper-2 p-3 text-sm text-black">
                <span className="k-label">{GROUP_LABEL[filters.group] ?? filters.group}</span>
                <button type="button" onClick={() => set({ group: null })} className="inline-flex min-h-11 items-center k-btn">
                  Show all topics
                </button>
              </div>
            )}

            <div className="mb-6 sm:hidden">
              <label htmlFor="dictionary-letter" className="mb-1 block text-black/70 k-label">
                Jump to letter
              </label>
              <select
                id="dictionary-letter"
                value={filters.letter ?? ""}
                onChange={(e) => set({ letter: e.target.value || null })}
                className="h-11 w-full border border-black bg-white px-3 text-sm text-black"
              >
                <option value="">All letters</option>
                {LETTERS.filter((l) => (letterCounts[l] ?? 0) > 0 || filters.letter === l).map((l) => (
                  <option key={l} value={l}>
                    {l} ({letterCounts[l] ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <nav aria-label="Jump to letter" className="mb-6 hidden flex-wrap gap-1 sm:flex">
              {LETTERS.map((l) => {
                const count = letterCounts[l] ?? 0;
                const active = filters.letter === l;
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={count === 0 && !active}
                    aria-pressed={active}
                    aria-label={`Terms starting with ${l}, ${count}`}
                    onClick={() => set({ letter: active ? null : l })}
                    className={`inline-flex h-11 min-w-11 items-center justify-center border px-2 text-xs font-black transition-colors duration-150 ease-out ${
                      active ? "border-black bg-black text-white" : count === 0 ? "border-black/20 text-black/30" : "border-black text-black hover:border-signal hover:text-signal"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </nav>

            <p className="mb-4 text-black/70 k-label" aria-live="polite">
              {results.length === 0 ? "No terms" : `Showing ${Math.min(shown, results.length).toLocaleString("en-US")} of ${results.length.toLocaleString("en-US")} terms`}
              {anyFacet && (
                <button type="button" onClick={() => setFilters({ ...EMPTY_FILTERS, includeAdjacent: filters.includeAdjacent })} className="ml-3 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:text-signal">
                  Clear filters
                </button>
              )}
            </p>

            {results.length === 0 ? (
              <p className="border border-black py-16 text-center text-sm italic text-black opacity-60">
                {filters.query.trim() ? `No terms match "${filters.query}".` : "No terms in this selection."}
                {!filters.includeAdjacent && hiddenAdjacent > 0 && filters.query.trim() ? " Try including advanced and adjacent terms." : ""}
              </p>
            ) : (
              <div className="space-y-3">
                {results.slice(0, shown).map((term) => (
                  <TermCard key={term.id} term={term} now={now} onRelated={goToRelated} />
                ))}
              </div>
            )}

            {results.length > shown && (
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE_SIZE)}
                className="mt-6 flex min-h-12 w-full items-center justify-center k-btn k-btn-primary"
              >
                Show {Math.min(PAGE_SIZE, results.length - shown)} more ({(results.length - shown).toLocaleString("en-US")} left)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DictionaryPage() {
  return (
    <PremiumGuard feature="dictionary">
      <TermList />
    </PremiumGuard>
  );
}
