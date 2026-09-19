"use client";

/**
 * Sprint 10: renders a report's individual articles as cards, each with
 * a bookmark toggle -- the structured view migration 009 made possible
 * (see that migration's comment). Falls back to nothing if the caller
 * has no linked articles (a report generated before Sprint 10 shipped);
 * the page itself still shows the raw markdown in that case.
 *
 * Bookmark state: fetched once for the whole list on mount (not
 * per-card) to avoid one request per article. Anonymous visitors see a
 * "Sign in to bookmark" affordance instead of a toggle -- this page
 * itself stays public/unauthenticated (matching the existing dashboard
 * precedent, see HANDOFF note on the P-13 paywall not being enforced
 * here), only the bookmark action itself requires a session.
 *
 * relatedSources (Phase 4, specs/vibe-coding-intelligence-engine/
 * ROADMAP.md): when the pipeline's event clustering
 * (features/pipeline/domain.ts clusterDuplicateEvents) has found other
 * sources covering the same event as a given article, their names are
 * shown as "Also covered by" instead of the coverage being silently
 * hidden -- fetched via features/pipeline/repository.ts
 * getRelatedSourcesForArticles() by the page, not this component.
 *
 * Phase 5 (Daily/Weekly Intelligence Format): this is the PRIMARY
 * user-facing rendering (the report's raw `markdown` is only a fallback
 * for pre-Sprint-10 reports with no linked articles, see
 * app/dashboard/page.tsx), so it needs the same WHAT HAPPENED / WHY IT
 * MATTERS / EVIDENCE / CONFIDENCE / WHAT TO WATCH fields as
 * formatDigestEntry() (app/api/cron/daily-digest/route.ts) -- found
 * live while building that function that who_it_affects/worth_trying
 * were already being collected by summarize() but never actually shown
 * anywhere, in the markdown OR here.
 *
 * Gamification (DECISION_LOG.md PDL-030): bookmarking an article is
 * this wave's one real reward trigger ("+15 Vibe Coina" per the
 * Director's own brief example) -- only on ADDING a bookmark, not
 * removing one (removing isn't a "did something" moment worth
 * celebrating, and the idempotency key means re-adding the same
 * article later would not pay out again anyway).
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import type { Article } from "@/lib/validation/schemas";
import { useRewards } from "@/components/rewards/RewardsProvider";

/**
 * Stress-test item D2 (Director, 2026-09-19: "the user does not see that there
 * is more content to read by scrolling"): a report is one long card and nothing
 * said so. Two cues, no new data: a numbered index of the headlines at the top
 * (each jumps to its article) and a small "N more below" button pinned to the
 * bottom of the screen once the reader has started scrolling, while any article is
 * still below the fold. It disappears once the last article is on screen, and
 * scrolls to the next one.
 */
const articleAnchor = (id: string) => `article-${id}`;

function HeadlineIndex({ articles }: { articles: Article[] }) {
  if (articles.length < 2) return null;
  return (
    <nav aria-label="Articles in this report" className="mt-6 border-2 border-black bg-[#F2F2F2] p-4 sm:p-6">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
        In this report, {articles.length} articles
      </h2>
      <ol className="space-y-0">
        {articles.map((article, i) => (
          <li key={article.id} className="border-t border-black/20 first:border-t-0">
            <a
              href={`#${articleAnchor(article.id)}`}
              className="flex min-h-11 items-start gap-3 py-2 text-sm font-bold text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
            >
              <span className="w-6 shrink-0 text-xs tabular-nums text-black/60">{String(i + 1).padStart(2, "0")}</span>
              <span className="break-words">{article.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function MoreBelowCue({ articles }: { articles: Article[] }) {
  const [below, setBelow] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      let count = 0;
      for (const article of articles) {
        const el = document.getElementById(articleAnchor(article.id));
        if (el && el.getBoundingClientRect().top > window.innerHeight - 8) count += 1;
      }
      // Not on the first screen: there the headline index (and the card being cut off
      // at the fold) is the cue, and a floating button would only cover it.
      setBelow(window.scrollY > 200 ? count : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [articles]);

  if (below === 0) return null;

  function goToNext() {
    for (const article of articles) {
      const el = document.getElementById(articleAnchor(article.id));
      if (el && el.getBoundingClientRect().top > window.innerHeight - 8) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }

  return (
    <button
      type="button"
      onClick={goToNext}
      aria-label={`Scroll to the next article, ${below} more below`}
      className="fixed bottom-10 left-1/2 z-30 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap border-2 border-black bg-black px-4 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
    >
      <span aria-hidden="true">↓</span>
      {below} more below
    </button>
  );
}

export function ArticleListWithBookmarks({
  articles,
  relatedSources,
}: {
  articles: Article[];
  relatedSources?: Record<string, string[]>;
}) {
  const { token, loading } = useSession();
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  // Gamification Wave 2: the celebration UI (toast/confetti/overlay) is
  // now rendered once, globally, by RewardsProvider -- not duplicated
  // in every component that calls award() (see that file's header
  // comment for why: a level-up triggered here now shows even though
  // this component itself renders nothing for it).
  const { award } = useRewards();

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetch("/api/bookmarks", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { bookmarks?: Array<{ article_id: string }> }) => {
        if (!active) return;
        setBookmarked(new Set((d.bookmarks ?? []).map((b) => b.article_id)));
        setBookmarksLoaded(true);
      })
      .catch(() => {
        if (active) setBookmarksLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [token, loading]);

  async function toggleBookmark(articleId: string) {
    if (!token) return;
    const isBookmarked = bookmarked.has(articleId);
    // Optimistic update -- reverted on failure below.
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(articleId);
      else next.add(articleId);
      return next;
    });

    try {
      const res = isBookmarked
        ? await fetch(`/api/bookmarks/${articleId}`, {
            method: "DELETE",
            headers: { authorization: `Bearer ${token}` },
          })
        : await fetch("/api/bookmarks", {
            method: "POST",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify({ article_id: articleId }),
          });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!isBookmarked) {
        // Only on ADD, not remove -- see this component's header comment.
        void award("bookmark_article", articleId);
      }
    } catch {
      // Revert the optimistic update on failure.
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(articleId);
        else next.delete(articleId);
        return next;
      });
    }
  }

  if (articles.length === 0) return null;

  return (
    <>
      <HeadlineIndex articles={articles} />
      <MoreBelowCue articles={articles} />
      <div className="mt-6 space-y-0">
        {articles.map((article, i) => {
          const isBookmarked = bookmarked.has(article.id);
          return (
            <div
              key={article.id}
              id={articleAnchor(article.id)}
              className={`scroll-mt-20 border-black p-4 sm:p-6 md:p-8 ${i === 0 ? "border-2" : "border-2 border-t-0"}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words text-lg font-black uppercase tracking-tight text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
                >
                  {article.title}
                </a>
                {!loading && (
                  <button
                    type="button"
                    onClick={() => (token ? toggleBookmark(article.id) : undefined)}
                    disabled={!token || !bookmarksLoaded}
                    title={token ? (isBookmarked ? "Remove bookmark" : "Bookmark") : "Sign in to bookmark"}
                    className={`min-h-11 shrink-0 self-start border-2 px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors duration-150 ease-out ${
                      isBookmarked
                        ? "border-[#FF3000] bg-[#FF3000] text-white"
                        : "border-black bg-white text-black"
                    } ${token ? "hover:border-[#FF3000] hover:bg-[#FF3000] hover:text-white" : "cursor-not-allowed opacity-40"}`}
                  >
                    {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                  </button>
                )}
              </div>
              {(article.summary || article.raw_summary) && (
                <p className="mt-3 text-sm leading-relaxed text-black">
                  {article.summary || article.raw_summary}
                </p>
              )}
              {article.why_it_matters && (
                <p className="mt-3 text-sm text-black">
                  <span className="font-bold uppercase tracking-wide">Why it matters: </span>
                  {article.why_it_matters}
                  {article.who_it_affects ? ` (${article.who_it_affects})` : ""}
                </p>
              )}
              {article.what_to_watch && (
                <p className="mt-3 text-sm text-black">
                  <span className="font-bold uppercase tracking-wide">What to watch: </span>
                  {article.what_to_watch}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-black">
                {article.category && (
                  <span className="border-2 border-black px-2 py-0.5">{article.category}</span>
                )}
                {article.source && (
                  <span className="border-2 border-black px-2 py-0.5">{article.source}</span>
                )}
                {article.confidence_score != null && (
                  <span className="border-2 border-black px-2 py-0.5">
                    {Math.round(article.confidence_score * 100)}% confidence
                  </span>
                )}
                {article.worth_trying && (
                  <span
                    className={`border-2 px-2 py-0.5 ${
                      article.worth_trying === "yes"
                        ? "border-[#FF3000] text-[#FF3000]"
                        : "border-black text-black"
                    }`}
                  >
                    Worth trying: {article.worth_trying === "yes" ? "Yes" : article.worth_trying === "no" ? "No" : "Maybe"}
                  </span>
                )}
              </div>
              {relatedSources?.[article.id] && relatedSources[article.id]!.length > 0 && (
                <p className="mt-3 text-xs italic text-black opacity-60">
                  Also covered by: {relatedSources[article.id]!.join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
