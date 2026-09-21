/**
 * Post-payment welcome guide — shown exactly once, right after a
 * subscription activates (SubscriptionGuard redirects here instead of
 * rendering the destination page directly, only when the access-granted
 * moment follows a payment in the SAME session — see that component's
 * `awaitingWebhook` handling). Director's 2026-09-14 request: a
 * concise, single-page, precise guide to what the app does and what
 * the new subscriber can now do with it.
 */

import Link from "next/link";
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
    premium: true,
    title: "University",
    body: "A full curriculum on building software with AI, 75 lessons across beginner, intermediate, and expert, organized into chapters with quizzes and a final test per level. Start from wherever actually fits you.",
    href: "/university",
    cta: "Start the University",
  },
  {
    n: "05",
    premium: true,
    title: "Dictionary",
    body: "More than 2,600 terms in plain language, searchable in a keystroke and grouped by topic and level. It keeps growing: new terms are added automatically when they start appearing across the daily news.",
    href: "/dictionary",
    cta: "Open the Dictionary",
  },
  {
    n: "06",
    premium: true,
    title: "Assistant",
    body: "Answer a few plain questions about your project and get a build-ready prompt for Claude Code, Cursor or any AI coding tool, with a flow diagram and next steps. Up to 5 a day.",
    href: "/assistant",
    cta: "Write a Prompt",
  },
  {
    n: "07",
    premium: true,
    title: "Prompt School",
    body: "A hands-on course built on the book Mastering Prompt Engineering: lessons and exercises from your first clear prompt to advanced techniques. Chapters open one after another as you complete them.",
    href: "/prompt-school",
    cta: "Enter the School",
  },
];

export default function WelcomePage() {
  return (
    <div className="k-page">
      <div className="mx-auto max-w-3xl xl:max-w-4xl">
        <div className="mb-4 flex justify-center">
          <Mascot size={64} />
        </div>
        <p className="text-center text-signal k-label">
          You&apos;re In
        </p>
        <h1 className="mt-2 text-center text-black k-display">
          Welcome to Vibe-Coding Journal
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-black">
          Your subscription is active. Here is what the Journal offers. Features marked Premium need the $50 tier.
        </p>

        <div className="mt-12 border-black md:border-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.n}
              className={`border border-black p-8 ${i > 0 ? "border-t-0" : ""}`}
            >
              <span className="text-signal k-label">
                {feature.n}
                {"premium" in feature && feature.premium ? " · Premium" : ""}
              </span>
              <h2 className="mt-2 text-black k-h2">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-black">{feature.body}</p>
              <a
                href={feature.href}
                className="mt-5 inline-flex h-12 items-center justify-center k-btn k-btn-primary"
              >
                {feature.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="swiss-dots mt-8 border border-black bg-paper-2 p-8 text-center">
          <p className="text-signal k-label">Bonus</p>
          <h3 className="mt-2 text-black k-h4">
            Earn Vibe Coins as You Go
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm text-black">
            Bookmarking articles and returning daily earns Vibe Coins, streaks, and levels,
            a running record of how consistently you stay on top of the field.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 k-btn"
          >
            Skip to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
