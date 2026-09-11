import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Sprint 12: first automated test setup this project has ever had --
 * confirmed live 2026-09-11 (zero *.test.ts/*.spec.ts files existed
 * anywhere before this). Scoped to pure functions only (domain/
 * quality-engine/schedule-gate/permissions layers) -- nothing here
 * hits Supabase, Gemini, or any other network dependency, so no mocking
 * framework or test database is needed yet. `@/*` mirrors tsconfig.json
 * exactly so test files can import the same way application code does.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
