export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold">Vibe-Coding Journal</h1>
        <p className="mb-2 text-xl text-gray-600">
          Your daily edge in the AI coding revolution.
        </p>
        <p className="mb-8 text-gray-600">
          The AI development landscape changes every day. New models. New
          tools. New agents. New workflows. New possibilities. Vibe-Coding
          Journal watches the landscape for you — filters the noise,
          connects the dots, and delivers the intelligence you need to
          build better and faster.
        </p>

        <div className="space-y-4">
          <a
            href="/register"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            Enter the Journal
          </a>
          <p className="text-sm text-gray-600">
            Already a member?{" "}
            <a href="/register" className="font-semibold text-blue-600 hover:text-blue-800">
              Sign in
            </a>
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-bold">10 Minutes. Every Day. Stay Ahead.</h2>
        <p className="mt-2 text-sm text-gray-600">
          A daily intelligence briefing built to keep you informed without overwhelming you.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <h3 className="mb-2 font-semibold">Curated for Vibe-Coders</h3>
            <p className="text-sm text-gray-600">
              AI coding agents, platforms, models, tools, workflows, techniques, and the
              developments that actually affect how you build.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Know. Test. Decide.</h3>
            <p className="text-sm text-gray-600">
              Every insight goes beyond the headline: what happened, why it matters, and what
              you should do next.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Actionable</h3>
            <p className="text-sm text-gray-600">Every item includes what you should test or consider today</p>
          </div>
        </div>
      </div>
    </div>
  );
}
