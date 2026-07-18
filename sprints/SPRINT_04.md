# SPRINT_04 — Scheduler + Admin Panel
# Vibe-Coding Journal
# Status: READY TO START

---

## Scope — IN

### 1. Scheduler (Automate Cron Calls)

#### 1a. Decision: Which Scheduler?
Three options, one will be chosen:

**Option A: Vercel Cron (Recommended for Vercel deployment)**
- Declarative cron in `vercel.ts` or `vercel.json`
- Automatically calls `/api/cron/daily-digest` on schedule
- No external dependencies
- Limitation: Vercel projects only
- **Governance:** E-5 (Platform-native > custom infrastructure)

**Option B: GitHub Actions (Recommended for GitHub repo)**
- Runs on schedule, triggers POST to cron endpoint
- Free for public repos, limited mins for private
- External CI/CD flow
- Limitation: Depends on GitHub availability
- **Governance:** P-1.1 (Fail loudly if cron fails)

**Option C: External Service (EasyCron, Uptime Robot, etc.)**
- Third-party cron service
- Reliable, observable
- Cost: varies
- Limitation: Adds external dependency
- **Governance:** A-3 (Swappable integrations)

**DECISION:** Will be logged in DECISION_LOG.md as PDL-005

#### 1b. Implementation (Once Decision Made)
- **Vercel:** Add `crons` array to `vercel.ts` or `vercel.json`
  ```js
  {
    "crons": [
      {
        "path": "/api/cron/daily-digest",
        "schedule": "0 9 * * *"  // 9 AM UTC daily
      }
    ]
  }
  ```
- **GitHub Actions:** Create `.github/workflows/daily-digest.yml`
  ```yaml
  name: Daily Digest Cron
  on:
    schedule:
      - cron: '0 9 * * *'  # 9 AM UTC daily
  jobs:
    cron:
      runs-on: ubuntu-latest
      steps:
        - run: |
            curl -X POST https://YOUR_DOMAIN/api/cron/daily-digest \
              -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
  ```
- **External Service:** Provide endpoint URL + CRON_SECRET header

#### 1c. Testing
- [ ] Verify cron trigger fires at expected time
- [ ] Check logs for successful pipeline execution
- [ ] Test failure handling (cron failure → alert or log)
- [ ] Verify email alerts sent when reports held_for_review

---

### 2. Admin Panel (Review Queue Dashboard)

#### 2a. Pages & Routes

**Route: `/admin/review-queue`**
- Protected: Role-based access control (admin only)
- Page: List all held_for_review reports
- Columns:
  - Date
  - Article count
  - Hold reasons (comma-separated or badges)
  - Status (held_for_review / manually_approved / etc.)
  - Actions: [View] [Approve] [Reject]

**Route: `/admin/review-queue/[date]`**
- Protected: Admin only
- Page: Detailed review for a specific date
- Display:
  - Date
  - Article count
  - Hold reasons (detailed list)
  - Full articles list:
    - Title
    - Summary
    - Source
    - Category
    - Confidence score
    - Flags (hype words detected / below threshold / etc.)
  - Actions: [Approve All] [Reject All] [Approve Individual] [Reject Individual]

#### 2b. Backend Requirements

**New Endpoints:**
- `GET /api/admin/reports` → List held reports (paginated)
  - Query: `?status=held_for_review&limit=10&offset=0`
  - Response: `{ reports: [{date, article_count, hold_reasons, review_status}], total, page }`
  - Auth: Admin only

- `GET /api/admin/reports/[date]` → Get report details
  - Response: `{ date, article_count, markdown, sections, articles: [...] }`
  - Auth: Admin only

- `PUT /api/admin/reports/[date]/approve` → Approve held report
  - Body: `{ approvedBy: "user@example.com" }`
  - Updates: review_status = "manually_approved", updated_at
  - Returns: Updated report
  - Auth: Admin only

- `PUT /api/admin/reports/[date]/reject` → Reject held report
  - Body: `{ rejectedBy: "user@example.com", reason?: string }`
  - Updates: review_status = "rejected", updated_at
  - Optionally: Archive articles or delete
  - Returns: Updated report
  - Auth: Admin only

**Database Updates:**
- Add admin user role (if not already in user_profiles)
- Update daily_reports RLS policy to allow admins to edit review_status
- Add audit fields: approved_by, approved_at, rejected_by, rejected_at (optional)

#### 2c. Frontend Components

**Components to build:**
- `components/AdminLayout.tsx` — Sidebar + auth check
- `components/ReviewQueueList.tsx` — Table of held reports
- `components/ReviewQueueDetail.tsx` — Detailed review for one date
- `components/ArticleReviewCard.tsx` — Individual article review (with flags)
- `components/ApprovalModal.tsx` — Confirm approve/reject

**Features:**
- Loading states
- Error handling
- Pagination
- Filter by status (held_for_review, approved, rejected)
- Sort by date (newest first)

#### 2d. Email on Approval
When admin approves a report:
- Send email to REVIEW_QUEUE_EMAIL: "Daily digest for [date] approved and published"
- Include: article count, approval timestamp, approver

---

### 3. Access Control (Admin Role)

**New rule in `lib/permissions.ts`:**
```ts
export function canAccessAdminPanel(user: User): boolean {
  return user.role === 'admin';
}

export function canApproveReport(user: User): boolean {
  return user.role === 'admin';
}
```

**Update `middleware.ts`:**
```ts
// Protect /admin/* routes
if (pathname.startsWith('/admin')) {
  if (!user || !canAccessAdminPanel(user)) {
    return NextResponse.redirect('/');
  }
}
```

**Supabase RLS Update:**
```sql
-- Allow admins to update review_status on daily_reports
create policy "admins_can_approve_reports" on daily_reports
  for update using (
    auth.jwt() ->> 'role' = 'admin'
  )
  with check (auth.jwt() ->> 'role' = 'admin');
```

---

### 4. Integration with Sprint 03

**Email notifications upgrade:**
- When report approved: Send email to REVIEW_QUEUE_EMAIL
- Include: "Report for [date] approved and published — [article count] articles"
- Template: Formal approval notification (simple, professional)

**Daily Report structure (no changes):**
- review_status remains: auto_published / held_for_review / manually_approved
- On approval: Set manually_approved (not auto_published, to track which were reviewed)

---

## Scope — OUT (explicitly, do not build)

- Bulk approval (all reports at once) — single-report approval only
- Article-level approval/rejection (only report-level approval/rejection)
- Scheduling configuration UI (cron schedule is code-only)
- Audit logs with detailed change history (basic timestamps sufficient)
- Permission levels beyond admin/user (admin is binary)
- Notification templates (use simple hardcoded templates)
- Advanced filtering (held_for_review status is sufficient)
- ML feedback integration (don't adjust scoring based on approvals)
- Mobile admin interface (web only)

---

## Constitution References

- **P-1.1** (Fail Loudly): Cron failures logged and alertable
- **P-6** (Review Queue): Admin approval workflow
- **E-4** (Security): Admin role check before report edits
- **E-6** (API Structure): Five-step for approval endpoints
- **A-1** (5-Layer Pattern): Admin routes follow standard layers
- **M-7** (Single Source of Truth): lib/permissions.ts for all access control

---

## Definition of Done

Full Commander DONE_CHECKLIST.md applies, plus Sprint 04 specifics:

- [ ] **Scheduler decision made and logged** (PDL-005 in DECISION_LOG.md)
- [ ] **Scheduler implemented** (Vercel/GitHub Actions/External service)
- [ ] **Cron calls firing on schedule** (verified in logs)
- [ ] **Admin role added to user_profiles schema** (if not already)
- [ ] **New endpoints created** (`/api/admin/reports*`) with auth checks
- [ ] **RLS policy updated** (admins can edit daily_reports.review_status)
- [ ] **Admin routes protected** (middleware redirects non-admins away from `/admin`)
- [ ] **ReviewQueueList component** displays held reports (paginated)
- [ ] **ReviewQueueDetail component** displays articles with flags
- [ ] **Approve endpoint tested** (curl, verify review_status updated)
- [ ] **Reject endpoint tested** (curl, verify review_status updated)
- [ ] **Email sent on approval** (test: curl approve, check email)
- [ ] **TypeScript strict** (`npx tsc --noEmit` zero errors)
- [ ] **Build passes** (`next build` successful)
- [ ] **End-to-end flow tested:** Hold report → Admin reviews → Approves → Email sent
- [ ] **corrections/SPRINT_04_LESSONS.md created** with learnings
- [ ] **HANDOFF_SPRINT_04.md created** (environment setup, critical files, next steps)

---

## Implementation Order

1. **Decision:** Scheduler choice (Vercel/GitHub Actions/External)
2. **Scheduler:** Implement cron automation
3. **Database:** Add admin role + RLS policy
4. **Backend:** Create /api/admin/reports* endpoints
5. **Frontend:** Build ReviewQueueList + ReviewQueueDetail pages
6. **Integration:** Email on approval
7. **Testing:** End-to-end (hold → approve → email)
8. **Lessons:** Document findings in corrections/SPRINT_04_LESSONS.md

---

## Technical Notes

### Scheduler Considerations
- Cron runs at fixed time (recommend 9 AM UTC, adjust for user timezone later)
- If cron takes >30s, keep monitoring logs for slow pipeline stages
- Verify CRON_SECRET is set in production before enabling scheduler

### Admin Panel Considerations
- Admin user must be created in database (or promoted via admin SQL)
- Start simple: no filters, just list all held reports
- Pagination crucial if hundreds of reports accumulate
- Approval is idempotent (approving twice = same result)

### RLS Considerations
- Admins can read/update daily_reports (new policy)
- Regular users can only read their own reports (if implemented later)
- Current schema: all reports visible to anyone (no user FK) — update if personalization added

---

## Handoff Note Template (fill at sprint end)

```
HANDOFF NOTE — Sprint 04
Completed: [Scheduler choice, Admin Panel routes, Review dashboard, Email on approval]
Not completed: [if any]
Open risks: [Database migration timing, RLS policy edge cases]
Technical debt: [Admin panel could use loading optimizations]
Next sprint: [recommended: Sprint 05 — Scheduler hardening, Personalization, Analytics]
```

---

*Vibe-Coding Journal — Sprint 04 — governed by Commander v1.2*
