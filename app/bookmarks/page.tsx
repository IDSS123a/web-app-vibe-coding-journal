"use client";

/**
 * My Bookmarks (Sprint 10). Client-rendered like the admin pages --
 * this app's auth session lives in the browser (supabase-js
 * localStorage), so a per-user list like this has to be fetched
 * client-side against /api/bookmarks with the session token, the same
 * pattern components/AdminGuard already uses for the admin area.
 */

import Link from "next/link";
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
      setError("Failed to remove a bookmark, refresh to see the current list.");
    }
  }

  return (
    <div className="min-h-dvh bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-4xl xl:max-w-5xl">
        <div className="mb-12 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
            Saved
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
            My Bookmarks
          </h1>
          <p className="mt-2 text-sm text-black">Articles you&apos;ve saved</p>
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}

        {!loading && !token && (
          <div className="border-4 border-black py-16 text-center">
            <p className="mb-4 text-sm text-black">You must be signed in to see your bookmarks.</p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center text-sm font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
            >
              Sign In →
            </Link>
          </div>
        )}

        {error && <p className="mb-4 border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}

        {!loading && token && bookmarks === null && !error && (
          <p className="text-sm text-black opacity-60">Loading your bookmarks…</p>
        )}

        {!loading && token && bookmarks !== null && bookmarks.length === 0 && (
          <p className="border-4 border-black py-16 text-center text-sm italic text-black opacity-60">
            No bookmarks yet, bookmark an article from the{" "}
            <Link href="/dashboard" className="font-bold uppercase not-italic underline decoration-2 underline-offset-4 hover:text-[#FF3000]">
              dashboard
            </Link>{" "}
            or{" "}
            <Link href="/archive" className="font-bold uppercase not-italic underline decoration-2 underline-offset-4 hover:text-[#FF3000]">
              archive
            </Link>
            .
          </p>
        )}

        {bookmarks && bookmarks.length > 0 && (
          <div className="border-black md:border-4">
            {bookmarks.map((b, i) => (
              <div
                key={b.id}
                className={`border-4 border-black p-6 md:p-8 ${i > 0 ? "border-t-0" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <a
                    href={b.article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-black uppercase tracking-tight text-black transition-colors duration-150 ease-out hover:text-[#FF3000]"
                  >
                    {b.article.title}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeBookmark(b.article_id)}
                    className="shrink-0 border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] hover:text-white"
                  >
                    Remove
                  </button>
                </div>
                {(b.article.summary || b.article.raw_summary) && (
                  <p className="mt-3 text-sm leading-relaxed text-black">
                    {b.article.summary || b.article.raw_summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center gap-6 text-xs font-bold uppercase tracking-widest text-black">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            ← Dashboard
          </Link>
          <Link href="/archive" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]">
            Archive
          </Link>
        </div>
      </div>
    </div>
  );
}
