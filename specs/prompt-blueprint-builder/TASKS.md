# TASKS — Vibe-Coding Assistant (Prompt Blueprint Builder)

Mirrors `PLAN.md`. Completed 2026-09-16 — see `DECISION_LOG.md` PDL-047 for the ship summary and live-verification detail.

- [x] 1. Database migration — `supabase/migrations/019_prompt_assistant.sql`, applied via Supabase Management API, verified live
- [x] 2. TypeScript types — inlined in `features/prompt-assistant/domain.ts` / `repository.ts` / `lib/ai/ai-provider.ts`, matching this codebase's actual convention (no project feature uses a standalone `types.ts`)
- [x] 3. Zod validation schema — `promptAssistantWizardSchema` in `lib/validation/schemas.ts`
- [x] 4. Canon source — `lib/ai/prompt-canon.ts`
- [x] 5. AI provider interface — `generatePromptBlueprint` in `lib/ai/ai-provider.ts` (+ fail-closed `NoOpProvider`)
- [x] 6. AI provider implementation — `GeminiProvider.generatePromptBlueprint()` in `lib/ai/gemini-provider.ts`
- [x] 7. Permissions — `hasPremiumTierAccess` + `canAccessPromptAssistant` in `lib/permissions.ts`; `canAccessUniversity` refactored to use the shared helper
- [x] 8. Repository function — `features/prompt-assistant/repository.ts`
- [x] 9. Domain logic — `features/prompt-assistant/domain.ts`
- [x] 10. API routes — all four, E-6 sequenced
- [x] 11. `/api/me` — `hasAssistantAccess` field added
- [x] 12. UI component — `app/assistant/page.tsx`
- [x] 13. Integration — `SiteNav` link added; `PremiumGuard` generalized (`accessKey`/`blockedMessage` props) rather than duplicated
- [x] 14. Self-review — `npm run typecheck` and `npm run build` both clean; no `any`/`@ts-ignore` in new code; no DB queries outside `repository.ts`; service-role key only in `repository.ts`
- [x] 15. Testing — live in the browser preview: real wizard submission → real Gemini generation → correct Blueprint output → persisted → visible in history (list + detail) → admin usage endpoint accurate → mobile viewport clean. One real bug found and fixed during this step (missing `ensureAIProviderInitialized()` call, see PDL-047)
- [x] 16. Documentation — `CHANGELOG.md`, `DECISION_LOG.md` PDL-047, `CONSTITUTION.md` P-19 → `[ACTIVE]`. No `.env.example` change needed (reuses existing `GEMINI_API_KEY_*`)
- [ ] 17. Commit and handoff — pending Director go-ahead to commit
