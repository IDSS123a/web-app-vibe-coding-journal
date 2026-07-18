export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold">Vibe-Coding Journal</h1>
        <p className="mb-2 text-xl text-gray-600">
          Automated daily intelligence digest for vibe-coders
        </p>
        <p className="mb-8 text-gray-600">
          Stay updated with news, tools, and insights relevant to AI-powered software development.
        </p>

        <div className="space-y-4">
          <a
            href="/register"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            Get Started
          </a>
          <p className="text-sm text-gray-600">
            Already a member?{" "}
            <a href="/register" className="font-semibold text-blue-600 hover:text-blue-800">
              Sign in
            </a>
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <h3 className="mb-2 font-semibold">Daily Digest</h3>
            <p className="text-sm text-gray-600">One curated page per day, readable in under 10 minutes</p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Vibe-Coder Focused</h3>
            <p className="text-sm text-gray-600">News and tools specifically relevant to AI-assisted development</p>
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
