# SPRINT_04 Integration Notes

## Completed Work

✅ **Vercel Cron Configuration** (PDL-005 decision implemented)
- `vercel.json` created with cron schedule: 9 AM UTC daily
- Calls `/api/cron/daily-digest` endpoint
- Ready for deployment to Vercel

✅ **Admin Role Infrastructure**
- `supabase/migrations/003_admin_role.sql` created
  - Adds `role` column to user_profiles (user | admin)
  - Adds RLS policy for admin report updates
  - Adds audit columns to daily_reports (approved_by, approved_at, rejected_by, rejected_at)
- `lib/validation/schemas.ts` updated
  - UserProfile schema includes role field
  - DailyReport schema includes audit fields
- `lib/permissions.ts` updated
  - canAccessAdminPanel() checks for admin role
  - canApproveReports() checks for admin role
  - canRejectReports() checks for admin role

✅ **Admin API Endpoints** (E-6: Five-step auth/authorize/validate/execute/return)
- `GET /api/admin/reports` - List held_for_review reports (paginated)
- `GET /api/admin/reports/[date]` - Get report details with articles
- `PUT /api/admin/reports/[date]/approve` - Approve report
- `PUT /api/admin/reports/[date]/reject` - Reject report with reason

✅ **Admin UI (Client-side)**
- `app/admin/layout.tsx` - Admin header + navigation
- `app/admin/review-queue/page.tsx` - List held reports with pagination
- `app/admin/review-queue/[date]/page.tsx` - Detail review with approve/reject actions

✅ **Build & TypeScript**
- TypeScript strict: zero errors
- Next.js build: successful
- All Next.js 15 async params patterns applied

---

## Remaining Work (Integration Points)

### 1. Database Migration Application
**What:** Apply `003_admin_role.sql` to Supabase
**Status:** Not applied yet
**How to apply:**
```bash
supabase db push
```
OR manually via Supabase dashboard SQL editor

**Verification:**
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'role';
```

### 2. Authentication Token Integration
**Files with TODO:** All API endpoints and UI pages
**What needs:** Extract user role from Supabase JWT token
**Pattern to implement:**
```ts
// In route handlers:
const token = authHeader.split(" ")[1];
const decodedToken = await verifySupabaseToken(token);
const userRole = decodedToken.role;
const approverEmail = decodedToken.email;

// In client components (after UI auth):
const session = useSession(); // or similar
const userRole = session?.user?.role;
```

**Files to update:**
- app/api/admin/reports/route.ts (line 24: `const isAdmin = true;`)
- app/api/admin/reports/[date]/route.ts (line 24: `const isAdmin = true;`)
- app/api/admin/reports/[date]/approve/route.ts (lines 26, 25: `const isAdmin = true;` + approverEmail extraction)
- app/api/admin/reports/[date]/reject/route.ts (lines 26, 25: `const isAdmin = true;` + rejecterEmail extraction)
- app/admin/review-queue/page.tsx (line 31: get token from session/auth)
- app/admin/review-queue/[date]/page.tsx (lines 32, 107, 118: get token from session/auth)

### 3. Middleware Auth Check
**File:** middleware.ts
**Current:** Placeholder, no actual auth check
**What needs:** Verify user role and redirect non-admins from /admin routes
**Pattern:**
```ts
if (isProtected && pathname.startsWith('/admin')) {
  // Check for admin role via Supabase session
  // If not admin: redirect to /
  // If admin: continue
}
```

### 4. Cron Secret Setup
**File:** .env.local (or production environment)
**What needs:** Set CRON_SECRET to strong random value for production
**Current:** `dev-secret-change-in-production` (dev only)
**How to generate (bash):**
```bash
openssl rand -base64 32
```

### 5. Review Queue Email Testing
**File:** lib/email/resend.ts
**Status:** Implemented, but requires RESEND_API_KEY
**What needs:**
- Set RESEND_API_KEY in environment
- Test email sending via approve/reject endpoints
- Update email template with one-click approve/reject buttons (optional for MVP)

### 6. Admin User Creation
**What:** Promote a test user to admin role
**How (SQL):**
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'test@example.com';
```
OR create via insert:
```sql
INSERT INTO user_profiles (id, email, role, ...)
VALUES (gen_random_uuid(), 'admin@example.com', 'admin', ...);
```

---

## Testing Checklist (Post-Integration)

- [ ] Migrate database (apply 003_admin_role.sql)
- [ ] Create/promote test admin user
- [ ] Test GET /api/admin/reports (should return held reports)
- [ ] Test GET /api/admin/reports/[date] (should return report + articles)
- [ ] Test PUT /api/admin/reports/[date]/approve (should set review_status = manually_approved)
- [ ] Test PUT /api/admin/reports/[date]/reject (should set review_status = rejected)
- [ ] Test /admin/review-queue page loads (should list held reports)
- [ ] Test /admin/review-queue/[date] page loads (should show articles)
- [ ] Test approve button (should redirect to list after success)
- [ ] Test reject button (should open modal, then redirect after success)
- [ ] Test email notification on approve
- [ ] Test email notification on reject
- [ ] Verify Vercel cron fires at 9 AM UTC (check Vercel dashboard)
- [ ] Verify non-admin users are redirected from /admin routes

---

## Architecture & Patterns

### E-6 Five-Step Applied
All admin endpoints follow this pattern:
1. **Authenticate:** Verify Bearer token
2. **Authorize:** Check admin role
3. **Validate:** Verify request params/body format
4. **Execute:** Database operation
5. **Return:** JSON response with status

### RLS Policy (Supabase)
New policy allows admins to update daily_reports:
- Only admins (role = 'admin') can SET review_status, approved_by, etc.
- Regular users can only read reports (if personalization added later)

### Next.js 15 Async Params
All route handlers use new Next.js 15 pattern:
```ts
{ params }: { params: Promise<{ date: string }> }
const { date } = await params;
```

---

## Known Limitations (MVP)

1. **No bulk approval:** Admin must approve one report at a time
2. **No article-level approval:** Only report-level approval/rejection
3. **Email template minimal:** No one-click buttons in email (add in Sprint 05)
4. **No audit log:** Approval/rejection tracked via approved_by/rejected_by, no detailed audit trail
5. **No soft-delete:** Rejected articles are not archived, only report status changes
6. **No role management:** No UI to promote users to admin (SQL-only for now)

---

## Next Steps (Sprint 04 Continuation)

1. Apply database migration (003_admin_role.sql)
2. Integrate Supabase auth tokens into all endpoints + UI
3. Update middleware.ts with actual role check
4. Create test admin user and test full flow
5. Verify Vercel cron deployment and execution
6. Document learnings in corrections/SPRINT_04_LESSONS.md

---

## References

- PDL-005: Scheduler = Vercel Cron (DECISION_LOG.md)
- Sprint 04 scope: SPRINT_04.md
- Admin API design: app/api/admin/reports/route.ts
- Admin UI: app/admin/review-queue/page.tsx

