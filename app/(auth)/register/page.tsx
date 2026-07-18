import { RegisterForm } from "@/features/onboarding/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">Vibe-Coding Journal</h1>
        <p className="mb-8 text-center text-gray-600">
          Automated daily intelligence digest for vibe-coders
        </p>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
