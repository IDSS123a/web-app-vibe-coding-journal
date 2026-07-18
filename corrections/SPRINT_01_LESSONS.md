# SPRINT_01 Lessons Learned

## Corrections Applied
*[To be filled during sprint]*

## Gotchas Discovered
*[To be filled during sprint]*

## Commander Improvement Candidates
*[To be filled during sprint]*

---

## Individual Entries

### [2026-07-18 14:30] — TypeScript strict mode compliance
- **What happened:** Initial schema and components had unused imports/variables due to E-1 strict TypeScript configuration (noUnusedLocals, noUnusedParameters enabled).
- **Resolution:** Removed unused type imports from schemas.ts and cleaned up unused function parameters in permissions.ts. Adjusted date field type annotation in dashboard to satisfy string type requirement.
- **Commander relevance:** E-1 (TypeScript strictness) — enforcing zero `any` types, unused variables, proper type annotations
