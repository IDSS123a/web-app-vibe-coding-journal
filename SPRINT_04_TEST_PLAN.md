# SPRINT_04 Test Plan — Admin User + End-to-End

**Objective:** Verify complete admin workflow with real Supabase JWT token

---

## STEP 1: Create Test Admin User in Supabase

### Via Dashboard (Easiest for First Test)

1. Go to **https://app.supabase.com** → Select your project
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → Select **Create new user**
4. Fill in:
   - Email: `admin@test.local`
   - Password: `TestPassword123!` (or choose your own)
   - Auto Confirm User: **ON** (skip verification email)
5. Click **Create user**

### Promote to Admin Role

6. Go to **SQL Editor** → Click **New query**
7. Run:
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@test.local';
```
8. Click **Execute** → Should show "1 row updated"

---

## STEP 2: Get JWT Access Token

### Option A: Via Dashboard Sign-In (Recommended for Testing)

1. Open browser console (F12)
2. Go to your app homepage
3. Navigate to `/register` page
4. Instead of registering, go to browser DevTools → **Application** tab
5. Look for `sb-${PROJECT_REF}-auth-token` in **Cookies**
6. This cookie contains the session JSON with `access_token`

**Better Option:** Use Supabase CLI to get token:

```bash
# Install if not already installed
npm install -g @supabase/cli

# Authenticate with your project
supabase projects list

# Get token for test user (interactive login)
supabase auth admin create-user --email admin@test.local --password TestPassword123!
```

### Option B: Manual Sign-In + Extract Token

1. Start dev server: `npm run dev`
2. Open http://localhost:3000/register
3. Sign in with: `admin@test.local` / `TestPassword123!`
4. Open browser DevTools → **Network** tab
5. Make any API call (or use console to call API)
6. Check the Authorization header in DevTools → should show `Bearer eyJ...`

### Option C: Direct API Call (if you have the credentials)

```bash
# Get token via Supabase Auth API
curl -X POST https://YOUR_PROJECT.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.local",
    "password": "TestPassword123!",
    "grant_type": "password"
  }'

# Response will contain "access_token"
# Example response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer",
#   "expires_in": 3600,
#   "refresh_token": "..."
# }
```

**Save the `access_token` value** — you'll need it for all test calls.

---

## STEP 3: Prepare Test Data

### Create a Held Report (if none exists)

Run via SQL Editor:

```sql
-- Create a test report with held_for_review status
INSERT INTO daily_reports (
  date, 
  markdown, 
  reading_time_minutes, 
  article_count, 
  sections, 
  review_status
) VALUES (
  CURRENT_DATE,
  '# Test Report\n\nThis is a test report awaiting review.',
  5,
  3,
  '["Summary", "Test"]',
  'held_for_review'
)
ON CONFLICT (date) DO UPDATE SET
  review_status = 'held_for_review'
RETURNING date, review_status;
```

**Note the date returned** — you'll use it in test calls below.

---

## STEP 4: Run End-to-End Tests

### Test Environment Setup

```bash
# Save your token in a variable (replace with actual token)
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Or set directly in each curl command:
# -H "Authorization: Bearer $TOKEN"
```

**Base URL:** `http://localhost:3000` (dev) or your deployed URL

---

### TEST 1: List Held Reports

```bash
curl -X GET "http://localhost:3000/api/admin/reports?status=held_for_review&limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid",
      "date": "2026-07-18",
      "markdown": "...",
      "article_count": 3,
      "review_status": "held_for_review",
      "created_at": "2026-07-18T...",
      "updated_at": "2026-07-18T..."
    }
  ],
  "total": 1,
  "page": 0,
  "pageSize": 10
}
```

**Verify:** 
- ✅ Returns 200 (not 401/403)
- ✅ `success: true`
- ✅ At least 1 report with `review_status: "held_for_review"`

**If 401:** Token expired or invalid → Get new token and retry

**If 403:** User not admin → Verify role via SQL:
```sql
SELECT id, email, role FROM user_profiles WHERE email = 'admin@test.local';
```

---

### TEST 2: Get Report Details

```bash
# Replace YYYY-MM-DD with actual date from TEST 1
curl -X GET "http://localhost:3000/api/admin/reports/2026-07-18" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "date": "2026-07-18",
  "report": {
    "id": "...",
    "date": "2026-07-18",
    "markdown": "...",
    "article_count": 3,
    "review_status": "held_for_review",
    ...
  },
  "articles": [
    {
      "id": "...",
      "title": "...",
      "summary": "...",
      "source": "...",
      "category": "...",
      "confidence_score": 0.65,
      ...
    }
  ],
  "articleCount": 3
}
```

**Verify:**
- ✅ Returns 200
- ✅ Report date matches query param
- ✅ Articles array present (even if empty for MVP)

---

### TEST 3: Approve Report

```bash
curl -X PUT "http://localhost:3000/api/admin/reports/2026-07-18/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approvedBy": "admin@test.local"}' \
  -v
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "date": "2026-07-18",
  "report": {
    "id": "...",
    "date": "2026-07-18",
    "review_status": "manually_approved",
    "approved_by": "admin@test.local",
    "approved_at": "2026-07-18T12:34:56.789Z",
    ...
  },
  "message": "Report approved and published"
}
```

**Verify:**
- ✅ Returns 200
- ✅ `review_status` changed to `"manually_approved"`
- ✅ `approved_by` set to approver email
- ✅ `approved_at` is current timestamp

**Check Database:**
```sql
SELECT date, review_status, approved_by, approved_at 
FROM daily_reports 
WHERE date = CURRENT_DATE;

-- Should show:
-- 2026-07-18 | manually_approved | admin@test.local | 2026-07-18 12:34:56.789...
```

**Check Email:**
- If `RESEND_API_KEY` configured: Check email for approval notification
- If not configured: Check logs for warning `[EMAIL] Resend not configured`

---

### TEST 4: Reject Report (Create New Held Report First)

```bash
# First, create another held report
# Via SQL:
INSERT INTO daily_reports (
  date,
  markdown,
  reading_time_minutes,
  article_count,
  sections,
  review_status
) VALUES (
  CURRENT_DATE + INTERVAL '1 day',
  '# Future Report',
  5,
  2,
  '["Summary"]',
  'held_for_review'
);

# Then reject it:
curl -X PUT "http://localhost:3000/api/admin/reports/2026-07-19/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejectedBy": "admin@test.local", "reason": "Low quality articles"}' \
  -v
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "date": "2026-07-19",
  "report": {
    "review_status": "rejected",
    "rejected_by": "admin@test.local",
    "rejected_at": "2026-07-18T12:35:00.000Z",
    ...
  },
  "message": "Report rejected"
}
```

**Verify:**
- ✅ Returns 200
- ✅ `review_status` changed to `"rejected"`
- ✅ `rejected_by` and `rejected_at` set
- ✅ Email notification sent (if RESEND_API_KEY configured)

---

### TEST 5: Unauthorized Access (No Token)

```bash
curl -X GET "http://localhost:3000/api/admin/reports" \
  -H "Content-Type: application/json" \
  -v

# Expected: 401 Unauthorized
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Verify:**
- ✅ Returns 401 (not 200)
- ✅ No data leaked

---

### TEST 6: Non-Admin User (Create Regular User, Get Token, Try API)

```bash
# Create regular user via Supabase Dashboard:
# Email: user@test.local, Password: Test123!
# (Don't promote to admin)

# Get token for regular user
curl -X POST https://YOUR_PROJECT.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.local",
    "password": "Test123!",
    "grant_type": "password"
  }' | jq -r '.access_token'

# Try to access admin endpoint
curl -X GET "http://localhost:3000/api/admin/reports" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -v

# Expected: 401 Unauthorized (verifyAdminToken rejects non-admin)
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Verify:**
- ✅ Returns 401 (role check working)
- ✅ Regular users cannot access admin APIs

---

## STEP 5: Test Email Notifications

### Setup (Required for Email Testing)

1. Go to Resend.com → Create account (free tier available)
2. Get API key from dashboard
3. Add to your `.env.local`:
```
RESEND_API_KEY=re_...
REVIEW_QUEUE_EMAIL=your-email@example.com
```
4. Restart dev server: `npm run dev`

### Test Email on Approval

1. Run TEST 3 (Approve Report) again
2. Check email inbox (or Resend dashboard) for:
   - **Subject:** `[REVIEW] Daily digest for 2026-07-18 approved`
   - **From:** `Vibe-Coding Journal <noreply@example.com>`
   - **Content:** Includes date, article count, approver

**Expected Email Headers:**
```
Subject: [ADMIN] Daily digest for 2026-07-18 approved
To: your-email@example.com
From: Vibe-Coding Journal <noreply@example.com>
```

**Verify:**
- ✅ Email received within 30 seconds
- ✅ Subject matches expected format
- ✅ HTML body includes approval details

---

## STEP 6: Verify Database State

After all tests, query database to confirm changes:

```sql
-- Check all daily reports with audit fields
SELECT 
  date,
  article_count,
  review_status,
  approved_by,
  approved_at,
  rejected_by,
  rejected_at,
  created_at,
  updated_at
FROM daily_reports
ORDER BY date DESC
LIMIT 10;

-- Check admin user
SELECT 
  id,
  email,
  role,
  created_at
FROM user_profiles
WHERE email = 'admin@test.local';
```

**Expected:**
- At least 2 reports (one approved, one rejected)
- Timestamps are current
- Approver/rejector emails correct

---

## STEP 7: Full UI Test (When Auth Session Integrated)

Once `lib/auth/use-session.ts` is created and integrated:

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/register
3. Sign in as `admin@test.local` / `TestPassword123!`
4. Navigate to http://localhost:3000/admin/review-queue
5. Should see table with held reports
6. Click **Review →** on a report
7. Verify articles display
8. Click **Approve** button
9. Should see success message and redirect to list
10. Verify report status changed in database

---

## Test Results Template

Copy and fill after running all tests:

```
SPRINT_04 END-TO-END TEST RESULTS
Date: 2026-07-18
Tester: [Your name]

✅ TEST 1: List Held Reports
Status: PASS / FAIL
Notes: [Any issues]

✅ TEST 2: Get Report Details
Status: PASS / FAIL
Notes: [Any issues]

✅ TEST 3: Approve Report
Status: PASS / FAIL
Notes: [Any issues]

✅ TEST 4: Reject Report
Status: PASS / FAIL
Notes: [Any issues]

✅ TEST 5: Unauthorized Access
Status: PASS / FAIL
Notes: [Any issues]

✅ TEST 6: Non-Admin User
Status: PASS / FAIL
Notes: [Any issues]

✅ TEST 7: Email Notifications
Status: PASS / FAIL / SKIPPED (no RESEND_API_KEY)
Notes: [Any issues]

✅ TEST 8: Database Audit Fields
Status: PASS / FAIL
Notes: [Any issues]

OVERALL: ALL TESTS PASSED ✅
```

---

## Troubleshooting

### 401 Unauthorized on Every Request
- **Cause:** Token expired or invalid
- **Fix:** Get new token, verify it starts with `eyJ`
- **Check:** `jq -R 'split(".")[1] | @base64d | fromjson' <<< "$TOKEN"` (decode payload)

### 403 Forbidden (User Not Admin)
- **Cause:** User role is 'user', not 'admin'
- **Fix:** Run SQL: `UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@test.local';`
- **Verify:** `SELECT role FROM user_profiles WHERE email = 'admin@test.local';`

### Email Not Sending
- **Cause:** `RESEND_API_KEY` not set or invalid
- **Fix:** 
  1. Check `.env.local` has valid key
  2. Restart dev server
  3. Check server logs for `[EMAIL]` messages
- **Fallback:** Without Resend, email silently skips (see logs for warning)

### Database Migration Not Applied
- **Cause:** `003_admin_role.sql` not executed
- **Fix:** Run via Supabase SQL Editor manually
- **Verify:** `SELECT * FROM user_profiles LIMIT 1;` should show `role` column

### Token Signature Invalid
- **Cause:** Using token from different Supabase project
- **Fix:** Ensure `NEXT_PUBLIC_SUPABASE_URL` matches token project
- **Check:** Token header contains project ref (between `supabase.co/` and `/auth`)

---

## Next Steps

Once all tests pass:
1. Document results in corrections/SPRINT_04_LESSONS.md
2. Create handoff note: HANDOFF_SPRINT_04.md
3. Begin Sprint 05: Scheduler automation + UI auth integration

