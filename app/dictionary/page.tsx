/**
 * Vibe-Coding Dictionary — searchable term list. Premium-only
 * (PremiumGuard).
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { PremiumGuard } from "@/components/PremiumGuard";
import type { DictionaryTerm } from "@/lib/validation/schemas";

function TermList() {
  const { token, loading: sessionLoading } = useSession();
  const [terms, setTerms] = useState<DictionaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetch("/api/dictionary", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { terms: DictionaryTerm[] }) => setTerms(d.terms))
      .catch(() => setError("Failed to load the dictionary."))
      .finally(() => setLoading(false));
  }, [token, sessionLoading]);

  const filtered = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.definition.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 border-b-4 border-black pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">Premium</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black md:text-5xl">
            Vibe-Coding Dictionary
          </h1>
          <p className="mt-2 text-sm text-black">Plain-language definitions for every term you'll meet in the University and the Daily Digest.</p>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms…"
          className="mb-8 w-full border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-[#FF3000]"
        />

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="border-4 border-black py-16 text-center text-sm italic text-black opacity-60">
            No terms match "{query}".
          </p>
        )}

        <div className="border-black md:border-4">
          {filtered.map((term, i) => (
            <div key={term.id} className={`border-4 border-black p-6 ${i > 0 ? "border-t-0" : ""}`}>
              <h3 className="text-lg font-black uppercase tracking-tight text-black">{term.term}</h3>
              <p className="mt-2 text-sm leading-relaxed text-black">{term.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DictionaryPage() {
  return (
    <PremiumGuard>
      <TermList />
    </PremiumGuard>
  );
}
