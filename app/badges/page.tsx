/**
 * Badges (PDL-075): every badge with the ones you have earned. Campus layer, like the rest of the learning side.
 * Any signed-in user may open it; the list comes from GET /api/badges (the catalogue plus the caller's earned ones).
 */

"use client";

import { useAuthedJson } from "@/lib/auth/use-authed-json";

interface BadgeRow {
  id: string;
  title: string;
  description: string;
  group: "start" | "prompt-school" | "university" | "habit";
  earned: boolean;
  awardedAt: string | null;
}

interface BadgesPayload {
  badges: BadgeRow[];
  earnedCount: number;
  total: number;
}

const GROUPS: Array<{ id: BadgeRow["group"]; label: string }> = [
  { id: "start", label: "Getting started" },
  { id: "prompt-school", label: "Prompt School" },
  { id: "university", label: "University" },
  { id: "habit", label: "Habits" },
];

export default function BadgesPage() {
  const { data, loading, error } = useAuthedJson<BadgesPayload>("/api/badges");

  return (
    <div className="k-page layer-campus">
      <div className="mx-auto max-w-4xl xl:max-w-5xl">
        <div className="mb-10 border-b border-studio-ink pb-8">
          <p className="mb-2 text-studio-blueberry k-clabel">Recognition</p>
          <h1 className="k-cheading">Badges</h1>
          <p className="k-cintro mt-3 max-w-2xl">
            Badges mark milestones: your first lesson, a passed level test, a streak. Each one is earned once, and none of them costs coins.
          </p>
          {data && (
            <p className="mt-3 k-clabel">
              {data.earnedCount} of {data.total} earned
            </p>
          )}
        </div>

        {loading && <p className="k-cbody">Loading…</p>}
        {error && <p role="alert" className="k-card-sm border-signal p-3 text-sm text-signal">{error}</p>}

        {data && (
          <div className="space-y-12">
            {GROUPS.map((g) => {
              const rows = data.badges.filter((b) => b.group === g.id);
              if (rows.length === 0) return null;
              return (
                <section key={g.id} aria-labelledby={`badges-${g.id}`}>
                  <h2 id={`badges-${g.id}`} className="k-h3 mb-4">{g.label}</h2>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {rows.map((b) => (
                      <li key={b.id} className={`k-card flex flex-col gap-2 p-4 sm:p-5 ${b.earned ? "" : "opacity-60"}`}>
                        <p className="k-clabel">
                          {b.earned ? (
                            <span className="k-pill bg-studio-lemon">Earned</span>
                          ) : (
                            <span className="k-pill">Locked</span>
                          )}
                        </p>
                        <h3 className="k-h4">{b.title}</h3>
                        <p className="k-cbody">{b.description}</p>
                        {b.earned && b.awardedAt && (
                          <p className="k-meta">{new Date(b.awardedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
