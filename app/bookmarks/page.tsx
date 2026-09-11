"use client";

/**
 * My Bookmarks (Sprint 10). Client-rendered like the admin pages --
 * this app's auth session lives in the browser (supabase-js
 * localStorage), so a per-user list like this has to be fetched
 * client-side against /api/bookmarks with the session token, the same
 * pattern components/AdminGuard already uses for the admin area.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import type { Article, Bookmark } from "@/lib/validation/schemas";

type BookmarkWithArticle = Bookmark & { article: Article };

export default function BookmarksPage() {
  const { token, loading } = useSession();
  const [bookmarks, setBookmarks] = useState<BookmarkWithArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !token) return;
    let active = true;
    fetch("/api/bookmarks", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { bookmarks?: BookmarkWithArticle[] }) => {
        if (active) setBookmarks(d.bookmarks ?? []);
      })
      .catch(() => {
        if (active) setError("Failed to load bookmarks.");
      });
    return () => {
      active = false;
    };
  }, [token, loading]);

  async function removeBookmark(articleId: string) {
    if (!token) return;
    setBookmarks((prev) => prev?.filter((b) => b.article_id !== articleId) ?? prev);
    try {
      const res = await fetch(`/api/bookmarks/${articleId}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setError("Failed to remove a bookmark — refresh to see the current list.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-50">My Bookmarks</h1>
          <p className="text-gray-600 dark:text-gray-400">Articles you've saved</p>
        </div>

        {loading && <p className="text-gray-500">Loading…</p>}

        {!loading && !token && (
          <div className="text-center py-12">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              You must be signed in to see your bookmarks.
            </p>
            <a href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
              Sign in →
            </a>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!loading && token && bookmarks === null && !error && (
          <p className="text-gray-500">Loading your bookmarks…</p>
        )}

        {!loading && token && bookmarks !== null && bookmarks.length === 0 && (
          <p className="italic text-gray-500">
            No bookmarks yet — bookmark an article from the{" "}
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
              dashboard
            </a>{" "}
            or{" "}
            <a href="/archive" className="text-blue-600 hover:text-blue-800">
              archive
            </a>
            .
          </p>
        )}

        {bookmarks && bookmarks.length > 0 && (
          <div className="space-y-4">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <a
                    href={b.article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-900 hover:text-blue-700 dark:text-gray-50 dark:hover:text-blue-400"
                  >
                    {b.article.title}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeBookmark(b.article_id)}
                    className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-600 hover:opacity-80 dark:bg-gray-800 dark:text-gray-400"
                  >
                    Remove
                  </button>
                </div>
                {(b.article.summary || b.article.raw_summary) && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {b.article.summary || b.article.raw_summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center gap-4 text-sm text-gray-600">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Dashboard
          </a>
          <a href="/archive" className="text-blue-600 hover:text-blue-800">
            Archive
          </a>
        </div>
      </div>
    </div>
  );
}
