/**
 * Top Tools to Try (Director-approved, 2026-10-02 six-step feasibility study).
 * Split by tier, not a single on/off gate like University/Dictionary: the paid-tools
 * section is Basic ($10)+, the free-tools section is Premium ($50) only -- this is the
 * business reason the Director gave for the rubric (specs intentionally not written up
 * as a separate guard component, since PremiumGuard/SubscriptionGuard both gate a
 * whole page on one tier). SubscriptionGuard gates the page itself (Basic minimum);
 * the free-tools section renders PremiumPitch inline when the viewer lacks Premium,
 * the same way PremiumGuard's blocked state does, just for one section instead of
 * the whole page.
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { PremiumPitch } from "@/components/PremiumPitch";
import { fetchMe, type MeResponse } from "@/lib/auth/fetch-me";
import type { PublicTool } from "@/features/tools/domain";

function ToolCard({ tool }: { tool: PublicTool }) {
  return (
    <article className="border border-black p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="break-words text-black k-h4">{tool.name}</h3>
        <span className="py-0.5 text-[11px] k-btn">{tool.pricing === "free" ? "Free" : "Paid"}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-black">{tool.description}</p>
      {tool.url && (
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:text-signal k-btn"
        >
          Visit site →
        </a>
      )}
    </article>
  );
}

function ToolsContent() {
  const { token, loading: sessionLoading } = useSession();
  const [tools, setTools] = useState<PublicTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    if (sessionLoading || !token) return;
    fetch("/api/tools", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { tools: PublicTool[] }) => setTools(d.tools))
      .catch(() => setError("Failed to load tools."))
      .finally(() => setLoading(false));
    fetchMe(token).then(setMe).catch(() => {});
  }, [token, sessionLoading]);

  const paidTools = tools.filter((t) => t.pricing === "paid");
  const freeTools = tools.filter((t) => t.pricing === "free");
  const hasFreeToolsAccess = me?.hasFreeToolsAccess ?? false;
  const isActiveBasic = me?.subscriptionTier === "basic" && me?.subscriptionStatus === "active";

  return (
    <div className="k-page">
      <div className="k-wide">
        <div className="mb-8 border-b border-black pb-8">
          <p className="mb-2 text-signal k-label">Basic and Premium</p>
          <h1 className="text-black k-display">Top Tools to Try</h1>
          <p className="mt-2 text-sm text-black">
            Tools that keep coming up across the articles we read every day, picked only once several
            independent sources mention one.
          </p>
        </div>

        {loading && <p className="text-sm text-black opacity-60">Loading…</p>}
        {error && <p role="alert" className="border border-signal p-3 text-sm text-signal">{error}</p>}

        {!loading && !error && (
          <>
            <section className="mb-10">
              <h2 className="mb-4 text-signal k-h4">Top Paid Tools to Try</h2>
              {paidTools.length === 0 ? (
                <p className="border border-black py-16 text-center text-sm italic text-black opacity-60">
                  No paid tools yet. Check back soon.
                </p>
              ) : (
                <div className="k-cards-lg gap-3">
                  {paidTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-signal k-h4">Top Free Tools to Try</h2>
              {hasFreeToolsAccess ? (
                freeTools.length === 0 ? (
                  <p className="border border-black py-16 text-center text-sm italic text-black opacity-60">
                    No free tools yet. Check back soon.
                  </p>
                ) : (
                  <div className="k-cards-lg gap-3">
                    {freeTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                )
              ) : (
                <PremiumPitch
                  feature="tools"
                  audience={{ isActiveBasic }}
                  token={token}
                  unlockedKey="hasFreeToolsAccess"
                  onUnlocked={() => fetchMe(token!).then(setMe).catch(() => {})}
                />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <SubscriptionGuard>
      <ToolsContent />
    </SubscriptionGuard>
  );
}
