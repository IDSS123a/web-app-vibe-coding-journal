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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="border-2 border-[#FF3000] p-3 text-sm text-[#FF3000]">{error}</div>}

      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-black">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          className="mt-1 block w-full border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-[#FF3000]"
        />
        {errors.email && <p className="mt-1 text-sm text-[#FF3000]">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-black">
          Password
        </label>
        <input
          {...register("password")}
          type="password"
          id="password"
          className="mt-1 block w-full border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-[#FF3000]"
        />
        {errors.password && <p className="mt-1 text-sm text-[#FF3000]">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-black">AI Tools Used</label>
        <div className="mt-3 space-y-3">
          {(["no_code_low_code", "ai_assisted_ide", "agent_based_coding", "other"] as const).map(
            (tool) => (
              <label key={tool} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  {...register("tools_used")}
                  value={tool}
                  className="h-5 w-5 shrink-0 appearance-none border-2 border-black bg-white checked:bg-black"
                />
                <span className="text-sm text-black">
                  {tool === "no_code_low_code" && "No-code / Low-code (Bolt, Lovable, etc.)"}
                  {tool === "ai_assisted_ide" && "AI-assisted IDE (Cursor, Windsurf)"}
                  {tool === "agent_based_coding" && "Agent-based coding (Claude Code, Copilot)"}
                  {tool === "other" && "Something else"}
                </span>
              </label>
            ),
          )}
        </div>
        {errors.tools_used && <p className="mt-1 text-sm text-[#FF3000]">{errors.tools_used.message}</p>}
      </div>

      <div>
        <label htmlFor="depth" className="block text-xs font-bold uppercase tracking-widest text-black">
          Technical Depth Preference
        </label>
        <select
          {...register("depth_preference")}
          id="depth"
          className="mt-1 block w-full appearance-none border-b-2 border-black bg-white px-1 py-2 text-black outline-none transition-colors duration-150 ease-out focus:border-[#FF3000]"
        >
          <option value="simple">Keep it simple</option>
          <option value="technical_when_needed">Technical when it matters</option>
          <option value="deep_technical">Deep technical</option>
        </select>
        {errors.depth_preference && (
          <p className="mt-1 text-sm text-[#FF3000]">{errors.depth_preference.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="h-14 w-full border-4 border-black bg-black text-sm font-bold uppercase tracking-widest text-white transition-colors duration-150 ease-out hover:border-[#FF3000] hover:bg-[#FF3000] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Creating Account..." : "Register"}
      </button>
    </form>
  );
}
