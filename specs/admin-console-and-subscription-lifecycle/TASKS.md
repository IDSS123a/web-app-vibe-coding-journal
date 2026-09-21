# TASKS — Admin Console & Subscription Lifecycle

> **Status 2026-09-22: shipped and live** (PDL-048; the users list, block and unblock, tier and plan end date, the $40 upgrade, the expiry reminders). The checkboxes below were not ticked as the work landed and are kept only as the original build order.

Mirrors `PLAN.md`. Build in this order.

- [ ] 1. Database migration — `supabase/migrations/020_admin_users_and_lifecycle.sql` (`is_blocked`, `created_by_admin_id`, `subscription_expiry_notifications`)
- [ ] 2. Blocking propagation — `features/onboarding/domain.ts` `evaluateSubscriptionAccess()` gains `is_blocked` check (M-7, single source of truth)
- [ ] 3. Zod schemas — `adminCreateUserSchema` in `lib/validation/schemas.ts`
- [ ] 4. `features/admin-users/repository.ts` — list users, get one user's detail (usage + payments), block/unblock, create account
- [ ] 5. `features/admin-users/domain.ts` — shaping/validation helpers
- [ ] 6. `features/payments/repository.ts` — `getPaymentEventsForUser` (new function, existing file)
- [ ] 7. `features/subscription-lifecycle/domain.ts` + `repository.ts` — expiry-window calc, idempotent notification recording, upgrade-eligibility check
- [ ] 8. `lib/payments/paypal-client.ts` — `createPayPalUpgradeOrder()`
- [ ] 9. `lib/email/resend.ts` — `sendSubscriptionExpiringEmail()`
- [ ] 10. Webhook extension — `app/api/webhooks/paypal/route.ts` $40/Basic→Premium branch
- [ ] 11. API routes — `app/api/admin/users/{,[id],[id]/block,[id]/unblock}`, `app/api/payments/create-upgrade-order`, `app/api/cron/subscription-expiry-check`
- [ ] 12. GitHub Actions workflow — `.github/workflows/subscription-expiry-trigger.yml`
- [ ] 13. UI — `app/admin/users/page.tsx` (list + detail + block/unblock + create-account form); `app/admin/layout.tsx` nav link; an "Upgrade to Premium" entry point for Basic subscribers (dashboard or a dedicated section)
- [ ] 14. Self-review — `FEATURE_LIFECYCLE.md` Step 4 checklist
- [ ] 15. Testing — real accounts, all three roles (Basic subscriber, Premium subscriber, admin), block/unblock live, upgrade payment live (sandbox), cron dry-run via `workflow_dispatch`
- [ ] 16. Documentation — `CHANGELOG.md`, `DECISION_LOG.md`, `.env.example` (no new env vars expected — confirm)
- [ ] 17. Commit and handoff — pending Director go-ahead
