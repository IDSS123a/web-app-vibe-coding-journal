/**
 * Selects and activates the concrete AI provider (PDL-006).
 * Kept separate from ai-provider.ts to avoid that module importing a
 * concrete provider implementation — ai-provider.ts stays the pure
 * interface + registry.
 */

import { setAIProvider } from "./ai-provider";
import { GeminiProvider } from "./gemini-provider";

let initialized = false;

export function ensureAIProviderInitialized(): void {
  if (initialized) return;
  initialized = true;

  // Sprint 06: dev/prod key sets — either configured set is enough to
  // activate GeminiProvider; loadApiKeys() inside it decides which set to
  // actually use per-call based on VERCEL_ENV.
  if (process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY_DEV_1) {
    setAIProvider(new GeminiProvider());
    console.log("[AI] Provider initialized: Gemini");
  } else {
    console.log("[AI] No GEMINI_API_KEY_1 / GEMINI_API_KEY_DEV_1 configured — AI provider stays NoOp");
  }
}
