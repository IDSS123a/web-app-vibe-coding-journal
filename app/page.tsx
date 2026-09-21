import Link from "next/link";

export default function HomePage() {
  return (
    <div className="k-page">
      {/* Hero */}
      <section className="swiss-noise border-b border-black px-6 py-24 md:px-12 md:py-32">
        <p className="mb-6 text-signal k-label">
          01. Vibe-Coding Journal
        </p>
        <h1 className="max-w-5xl text-[clamp(2rem,11.5vw,3.75rem)] leading-[0.95] text-black lg:text-[7.5rem] k-display">
          Your daily edge in the AI coding revolution.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-black md:text-xl">
          The AI development landscape changes every day. New models. New tools.
          New agents. New workflows. New possibilities. Vibe-Coding Journal watches
          the landscape for you, filters the noise, connects the dots, and
          delivers the intelligence you need to build better and faster.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Link
            href="/register"
            className="inline-flex h-16 items-center justify-center k-btn k-btn-primary"
          >
            Enter the Journal
          </Link>
          <p className="text-sm text-black">
            Already a member?{" "}
            <Link
              href="/login"
              className="underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal k-label"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* 02. System — value proposition */}
      <section className="swiss-grid-pattern border-b border-black bg-paper-2 px-6 py-20 md:px-12">
        <p className="mb-4 text-signal k-label">
          02. System
        </p>
        <h2 className="max-w-3xl text-black k-h2">
          10 Minutes. Every Day. Stay Ahead.
        </h2>
        <p className="mt-6 max-w-xl text-base text-black md:text-lg">
          A daily intelligence briefing built to keep you informed without
          overwhelming you.
        </p>
      </section>

      {/* 03. Method — the three pillars */}
      <section className="px-6 py-20 md:px-12">
        <p className="mb-4 text-signal k-label">
          03. Method
        </p>
        <div className="grid grid-cols-1 border-black md:grid-cols-3 md:border-4">
          {[
            {
              n: "01",
              title: "Curated for Vibe-Coders",
              body: "AI coding agents, platforms, models, tools, workflows, techniques, and the developments that actually affect how you build.",
            },
            {
              n: "02",
              title: "Know. Test. Decide.",
              body: "Every insight goes beyond the headline: what happened, why it matters, and what you should do next.",
            },
            {
              n: "03",
              title: "Actionable",
              body: "Every item includes what you should test or consider today.",
            },
          ].map((item, i) => (
            <div
              key={item.n}
              className={`group border border-black p-8 transition-colors duration-150 ease-out hover:bg-black md:border-4 md:p-12 ${
                i === 0 ? "md:border-r-0" : i === 1 ? "md:border-r-0" : ""
              } ${i > 0 ? "border-t-0 md:border-t-4" : ""}`}
            >
              <span className="text-signal k-label">
                {item.n}
              </span>
              <h3 className="mt-3 text-black group-hover:text-white k-h4">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-black group-hover:text-paper-2">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA strip */}
      <section className="swiss-dots border-t border-black bg-paper-2 px-6 py-16 text-center md:px-12">
        <Link
          href="/register"
          className="inline-flex h-16 items-center justify-center k-btn k-btn-primary"
        >
          Enter the Journal
        </Link>
      </section>
    </div>
  );
}
