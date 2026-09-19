/**
 * Post-payment welcome guide — shown exactly once, right after a
 * subscription activates (SubscriptionGuard redirects here instead of
 * rendering the destination page directly, only when the access-granted
 * moment follows a payment in the SAME session — see that component's
 * `awaitingWebhook` handling). Director's 2026-09-14 request: a
 * concise, single-page, precise guide to what the app does and what
 * the new subscriber can now do with it.
 */

import { Mascot } from "@/components/rewards/Mascot";

const FEATURES = [
  {
    n: "01",
    title: "Daily Digest",
    body: "A new intelligence briefing every day, readable in under 10 minutes. Real AI coding news, tools, and workflow changes, filtered for relevance, not just aggregated.",
    href: "/dashboard",
    cta: "Read Today's Digest",
  },
  {
    n: "02",
    title: "Archive",
    body: "Every past Daily Report, searchable by date. Missed a day? Nothing is lost.",
    href: "/archive",
    cta: "Browse the Archive",
  },
  {
    n: "03",
    title: "Bookmarks",
    body: "Save any article for later with one click. Your saved list lives in its own page, always a click away.",
    href: "/bookmarks",
    cta: "View Bookmarks",
  },
  {
    n: "04",
    title: "University",
    body: "A full curriculum on building software with AI, 75 lessons across beginner, intermediate, and expert, organized into chapters with quizzes and a final test per level. Start from wherever actually fits you.",
    href: "/university",
    cta: "Start the University",
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white px-4 py-16 md:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex justify-center">
          <Mascot size={64} />
        </div>
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#FF3000]">
          You&apos;re In
        </p>
        <h1 className="mt-2 text-center text-4xl font-black uppercase tracking-tighter text-black md:text-5xl">
          Welcome to Vibe-Coding Journal
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-black">
          Your subscription is active. Here is exactly what you can do now.
        </p>

        <div className="mt-12 border-black md:border-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.n}
              className={`border-4 border-black p-8 ${i > 0 ? "border-t-0" : ""}`}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF3000]">
                {feature.n}
              </span>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-black">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-black">{feature.body}</p>
              <a
                href={feature.href}
                className="mt-5 inline-flex h-12 items-center justify-center border-4 border-black bg-black px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000]"
              >
                {feature.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="swiss-dots mt-8 border-4 border-black bg-[#F2F2F2] p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF3000]">Bonus</p>
          <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-black">
            Earn Vibe Coins as You Go
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm text-black">
            Bookmarking articles and returning daily earns Vibe Coins, streaks, and levels,
            a running record of how consistently you stay on top of the field.
          </p>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-widest text-black underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
          >
            Skip to Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
