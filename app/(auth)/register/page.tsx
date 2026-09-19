import Link from "next/link";
import { RegisterForm } from "@/features/onboarding/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="swiss-noise flex min-h-dvh items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md border-4 border-black p-8 md:p-12">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#FF3000]">
          Join
        </p>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black">
          Vibe-Coding Journal
        </h1>
        <p className="mb-8 mt-2 text-sm text-black">
          Automated daily intelligence digest for vibe-coders
        </p>

        <RegisterForm />

        <p className="mt-8 text-center text-sm text-black">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold uppercase tracking-wide underline decoration-2 underline-offset-4 transition-colors duration-150 ease-out hover:text-[#FF3000]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
