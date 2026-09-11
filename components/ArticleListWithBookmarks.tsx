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
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import type { Article } from "@/lib/validation/schemas";

export function ArticleListWithBookmarks({ articles }: { articles: Article[] }) {
  const { token, loading } = useSession();
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);

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
    <div className="mt-6 space-y-4">
      {articles.map((article) => {
        const isBookmarked = bookmarked.has(article.id);
        return (
          <div
            key={article.id}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
          >
            <div className="flex items-start justify-between gap-4">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 hover:text-blue-700 dark:text-gray-50 dark:hover:text-blue-400"
              >
                {article.title}
              </a>
              {!loading && (
                <button
                  type="button"
                  onClick={() => (token ? toggleBookmark(article.id) : undefined)}
                  disabled={!token || !bookmarksLoaded}
                  title={token ? (isBookmarked ? "Remove bookmark" : "Bookmark") : "Sign in to bookmark"}
                  className={`shrink-0 rounded-md px-2 py-1 text-sm ${
                    isBookmarked
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  } ${token ? "hover:opacity-80" : "cursor-not-allowed opacity-50"}`}
                >
                  {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                </button>
              )}
            </div>
            {(article.summary || article.raw_summary) && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {article.summary || article.raw_summary}
              </p>
            )}
            {article.why_it_matters && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Why it matters: </span>
                {article.why_it_matters}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-500">
              {article.category && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{article.category}</span>
              )}
              {article.source && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{article.source}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
