import Link from "next/link";
import { RegisterForm } from "@/features/onboarding/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="swiss-noise flex items-center justify-center k-page">
      <div className="w-full max-w-md border border-black p-8 md:p-12">
        <p className="mb-2 text-signal k-label">
          Join
        </p>
        <h1 className="text-black k-display-card">
          Vibe-Coding Journal
        </h1>
        <p className="mb-8 mt-2 text-sm text-black">
          Daily intelligence digest for vibe-coders
        </p>

        <RegisterForm />

        <p className="mt-8 text-center text-sm text-black">
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:text-signal k-label"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
