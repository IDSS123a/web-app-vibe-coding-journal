// Bookmarks — Per-user saved articles (Sprint 10)
// Repository for managing user bookmarks

import { supabaseAdmin } from "@/lib/db/client";
import type { Article, Bookmark } from "@/lib/validation/schemas";

/**
 * A bookmark row joined with the article it points to -- what the
 * /bookmarks page actually needs to render (title, summary, etc.), not
 * just the bare join-table row.
 */
export type BookmarkWithArticle = Bookmark & { article: Article };

/**
 * Add a bookmark for a user. Idempotent by design (UNIQUE(user_id,
 * article_id) at the DB level, migration 001) -- bookmarking an
 * already-bookmarked article returns the existing row instead of
 * erroring, so the UI never has to special-case "already bookmarked"
 * before calling this.
 */
export async function addBookmark(userId: string, articleId: string): Promise<Bookmark> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("bookmarks")
    .upsert(
      { user_id: userId, article_id: articleId },
      { onConflict: "user_id,article_id", ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add bookmark: ${error.message}`);
  }

  return data as Bookmark;
}

/**
 * Remove a bookmark. Deleting a bookmark that doesn't exist is a no-op,
 * not an error -- the end state ("this article is not bookmarked") is
 * what the caller actually cares about.
 */
export async function removeBookmark(userId: string, articleId: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { error } = await supabaseAdmin
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("article_id", articleId);

  if (error) {
    throw new Error(`Failed to remove bookmark: ${error.message}`);
  }
}

/**
 * All of a user's bookmarks, newest first, joined with the article data
 * needed to render them -- the whole point of a bookmarks list.
 */
export async function getUserBookmarks(userId: string): Promise<BookmarkWithArticle[]> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }

  const { data, error } = await supabaseAdmin
    .from("bookmarks")
    .select("*, article:articles(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch bookmarks: ${error.message}`);
  }

  return (data ?? []) as unknown as BookmarkWithArticle[];
}

/**
 * The set of article IDs a user has already bookmarked, out of a given
 * candidate list -- used to render the correct bookmark-toggle state
 * (filled/outline) on a report's article list without an N+1 query.
 */
export async function getBookmarkedArticleIds(
  userId: string,
  articleIds: string[],
): Promise<Set<string>> {
  if (!supabaseAdmin) {
    throw new Error("Admin client not available");
  }
  if (articleIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabaseAdmin
    .from("bookmarks")
    .select("article_id")
    .eq("user_id", userId)
    .in("article_id", articleIds);

  if (error) {
    throw new Error(`Failed to fetch bookmarked article ids: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.article_id as string));
}
