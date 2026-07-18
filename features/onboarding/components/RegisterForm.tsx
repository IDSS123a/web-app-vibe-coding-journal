"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/schemas";
import { registerAction } from "@/features/onboarding/actions";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    setError(null);

    const result = await registerAction(data);

    if (!result.success) {
      setError(result.error || "Registration failed");
      setIsLoading(false);
      return;
    }

    // Success: redirect or show confirmation
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="rounded bg-red-100 p-4 text-red-800">{error}</div>}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          {...register("password")}
          type="password"
          id="password"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">AI Tools Used</label>
        <div className="mt-2 space-y-2">
          {(["no_code_low_code", "ai_assisted_ide", "agent_based_coding", "other"] as const).map(
            (tool) => (
              <label key={tool} className="flex items-center">
                <input type="checkbox" {...register("tools_used")} value={tool} />
                <span className="ml-2 text-sm">
                  {tool === "no_code_low_code" && "No-code / Low-code (Bolt, Lovable, etc.)"}
                  {tool === "ai_assisted_ide" && "AI-assisted IDE (Cursor, Windsurf)"}
                  {tool === "agent_based_coding" && "Agent-based coding (Claude Code, Copilot)"}
                  {tool === "other" && "Something else"}
                </span>
              </label>
            ),
          )}
        </div>
        {errors.tools_used && <p className="mt-1 text-sm text-red-600">{errors.tools_used.message}</p>}
      </div>

      <div>
        <label htmlFor="depth" className="block text-sm font-medium">
          Technical Depth Preference
        </label>
        <select
          {...register("depth_preference")}
          id="depth"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="simple">Keep it simple</option>
          <option value="technical_when_needed">Technical when it matters</option>
          <option value="deep_technical">Deep technical</option>
        </select>
        {errors.depth_preference && (
          <p className="mt-1 text-sm text-red-600">{errors.depth_preference.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
