/**
 * Top Profitable Ideas for Vibe-Coders. Premium only (PremiumGuard), unlike Tools which
 * splits by section -- the Director named this rubric alongside Tools' free-tools
 * section when describing what the $50 tier adds, so it gets the same full-page gate as
 * University/Dictionary/Assistant/Prompt School.
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { PublicIdea } from "@/features/ideas/domain";

function IdeaCard({ idea }: { idea: PublicIdea }) {
  return (
    <article className="border border-black p-4 sm:p-6">
      <h3 className="break-words text-black k-h4">{idea.title}</h3>
      <p className="mt-2 text-sm italic text-black">{idea.pitch}</p>
      <div className="mt-4 text-sm leading-relaxed text-black">
        <MarkdownContent>{idea.body}</MarkdownContent>
      </div>
    </article>
  );
}

function IdeaList() {
  const { token, loading: sessionLoading } = useSession();
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetch("/api/ideas", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { ideas: PublicIdea[] }) => setIdeas(d.ideas))
      .catch(() => setError("Failed to load ideas."))
      .finally(() => setLoading(false));
  }, [token, sessionLoading]);

  return (
    <div className="k-page">
      <div className="k-wide">
        <div className="mb-8 border-b border-black pb-8">
          <p className="mb-2 text-signal k-label">Premium</p>
          <h1 className="text-black k-display">Top Profitable Ideas for Vibe-Coders</h1>
          <p className="mt-2 text-sm text-black">
            A new project idea, found in the trends across recent articles, about once a week.
          </p>
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p role="alert" className="border border-signal p-3 text-sm text-signal">{error}</p>}

        {!loading && !error && (
          ideas.length === 0 ? (
            <p className="border border-black py-16 text-center text-sm italic text-black opacity-60">
              No ideas yet. Check back soon.
            </p>
          ) : (
            <div className="k-cards-lg gap-3">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function IdeasPage() {
  return (
    <PremiumGuard accessKey="hasIdeasAccess" feature="ideas">
      <IdeaList />
    </PremiumGuard>
  );
}
