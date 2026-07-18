# Supabase Admin User Setup — Visual Guide

**Goal:** Create admin user + get JWT token for testing

---

## STEP 1: Access Supabase Dashboard → Navigate to Authentication

### Location
```
https://app.supabase.com
  └─ Select your project (web-app-vibe-coding-journal)
     └─ Left Sidebar → Authentication
        └─ Users
```

### What You See
```
┌─────────────────────────────────────────────────────────────────┐
│ Authentication                                  🔍 Search Users  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Users  │  Policies  │  Providers                                │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌─ Add user ▼                                                   │
│                                                                   │
│  Users (1)                                                       │
│  ────────────────────────────────────────────────────────────────│
│  Email              │ Status      │ Last Sign In │ Actions   │  │
│  ────────────────────────────────────────────────────────────────│
│                                                                   │
│  (Table will be empty or have existing users)                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Action:** Click **Add user** button (green button, top-left)

---

## STEP 2: Create New User

### Dialog That Opens
```
┌─────────────────────────────────────────────────────────────────┐
│ Add User                                                    X    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Email *                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ admin@test.local                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Password *                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ TestPassword123!                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ☑ Auto Confirm User                                            │
│    (Check this box to skip email verification)                  │
│                                                                   │
│  [Cancel]  [Create user]                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Fill In Fields
1. **Email:** `admin@test.local`
2. **Password:** `TestPassword123!` (or choose your own)
3. **Auto Confirm User:** ✅ CHECK THIS BOX
   - Skips email verification for testing
   - User is immediately active

### Click
**[Create user]** button (blue)

**Expected Result:** User appears in table, status = "Confirmed"

---

## STEP 3: Promote User to Admin Role

### Navigate to SQL Editor
```
Left Sidebar
  └─ Development
     └─ SQL Editor
        └─ [New query]
```

### What You See
```
┌─────────────────────────────────────────────────────────────────┐
│ SQL Editor                                          ▶ Run         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ -- Write your SQL query here                                ││
│  │                                                              ││
│  │                                                              ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Results (0 rows)                                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Copy & Paste This SQL
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@test.local';
```

### Full Query in Editor
```
┌─────────────────────────────────────────────────────────────────┐
│ SQL Editor                                          ▶ Run         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ UPDATE user_profiles                                        ││
│  │ SET role = 'admin'                                          ││
│  │ WHERE email = 'admin@test.local';                           ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Results (0 rows)                                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Click
**[▶ Run]** button (top-right, blue play icon)

**Expected Result:** 
```
Results (1 row updated)
```

---

## STEP 4: Verify Admin Role Was Set

### Same SQL Editor
### Paste This Query
```sql
SELECT id, email, role 
FROM user_profiles 
WHERE email = 'admin@test.local';
```

### Results Should Show
```
┌────────────────────────────────────────────────────┐
│ Results (1 row)                                    │
├──────────────────────────────────────────────────┤
│ id                   │ email             │ role   │
├──────────────────────────────────────────────────┤
│ 550e8400-e29b-41d4-  │ admin@test.local  │ admin  │
│ a716-446655440000   │                   │        │
└──────────────────────────────────────────────────┘
```

**Verify:** role = `admin` ✅

---

## STEP 5: Get JWT Access Token (Option A: Sign In)

### In Your App
1. Open http://localhost:3000 (dev server)
2. Go to `/register` page
3. **Sign in** (not register) with:
   - Email: `admin@test.local`
   - Password: `TestPassword123!`
4. After login, open browser **DevTools** (F12)
5. Go to **Application** tab → **Cookies**
6. Look for cookie: `sb-[PROJECT_ID]-auth-token`
   - Should look like: `sb-twjqyubtpcrfdqlyvzwy-auth-token`
7. Copy the cookie value
8. Decode the JSON in the cookie (it's stored as JSON string)
   - Should contain `access_token` field
   - Token starts with `eyJ`

### Alternative: Get Token from Supabase
```bash
# Use Supabase API directly
curl -X POST https://twjqyubtpcrfdqlyvzwy.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.local",
    "password": "TestPassword123!",
    "grant_type": "password"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer",
#   "expires_in": 3600,
#   "refresh_token": "..."
# }
```

**Save this token:** You'll use it for all API tests

**Token Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpc3MiOiJodHRwczovL3R3amdxeXVidHBjcmZkcWx5dnp3eS5zdXBhYmFzZS5jbyIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFkbWluQHRlc3QubG9jYWwiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2ODcxMjM0NTYsImV4cCI6MTY4NzEyNzA1Nn0.
...signature...
```

---

## STEP 6: Create Test Data (Held Report)

### Back to SQL Editor
### Create a Test Report
```sql
INSERT INTO daily_reports (
  date, 
  markdown, 
  reading_time_minutes, 
  article_count, 
  sections, 
  review_status
) VALUES (
  CURRENT_DATE,
  '# Test Report\n\nThis is a test held report.\n\nArticles to review:\n- Article 1\n- Article 2\n- Article 3',
  5,
  3,
  '["Summary", "Test"]',
  'held_for_review'
)
ON CONFLICT (date) DO UPDATE SET
  review_status = 'held_for_review'
RETURNING date, review_status;
```

**Expected Result:**
```
┌────────────────────────────────────┐
│ Results (1 row)                    │
├────────────────────────────────────┤
│ date       │ review_status         │
├────────────────────────────────────┤
│ 2026-07-18 │ held_for_review       │
└────────────────────────────────────┘
```

**Save this date:** You'll use it in test URLs

---

## STEP 7: View user_profiles Table with role Column

### Navigate to Table Editor
```
Left Sidebar
  └─ Database
     └─ Tables
        └─ user_profiles
```

### What You See
```
┌─────────────────────────────────────────────────────────────────┐
│ user_profiles                    🔄 ⚙️ ...                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Columns:                                                        │
│  ☑ id        ☑ email           ☑ role           ☑ created_at   │
│  ☑ password  ☑ tools_used      ☑ depth_prefer   ☑ updated_at   │
│  ☑ other_tools_freetext                                         │
│                                                                   │
│  Rows (1)                                                        │
│  ────────────────────────────────────────────────────────────────│
│  id       │ email             │ role  │ created_at        │ ... │
│  ─────────────────────────────────────────────────────────────── │
│  550e8400 │ admin@test.local  │ admin │ 2026-07-18 12:30  │ ... │
│  -e29b-   │                   │       │                   │     │
│  41d4-    │                   │       │                   │     │
│  ...      │                   │       │                   │     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Verify:** `role` column exists and shows `admin` ✅

---

## STEP 8: View daily_reports Table with Audit Columns

### Navigate to Table
```
Left Sidebar
  └─ Database
     └─ Tables
        └─ daily_reports
```

### Scroll Right to See Audit Columns
```
┌─────────────────────────────────────────────────────────────────┐
│ daily_reports                                    🔄 ⚙️ ...      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Columns (visible):                                              │
│  ☑ id  ☑ date  ☑ markdown  ☑ review_status  ☑ approved_by      │
│  ☑ approved_at  ☑ rejected_by  ☑ rejected_at  ☑ created_at     │
│                                                                   │
│  Rows (1)                                                        │
│  ────────────────────────────────────────────────────────────────│
│  date       │ review_status      │ approved_by │ approved_at    │
│  ─────────────────────────────────────────────────────────────── │
│  2026-07-18 │ held_for_review    │ NULL        │ NULL           │
│                                                                   │
│  (Scroll right to see rejected_by, rejected_at)                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Verify:** `approved_by`, `approved_at`, `rejected_by`, `rejected_at` columns exist ✅

---

## Summary — What You Now Have

```
✅ Admin User Created
   Email: admin@test.local
   Password: TestPassword123!
   Role: admin

✅ JWT Access Token
   Format: Bearer eyJ...
   Expires: 1 hour (check token for exact time)

✅ Test Report Created
   Date: 2026-07-18 (or today's date)
   Status: held_for_review
   Articles: 3

✅ Database Ready
   role column in user_profiles
   audit columns in daily_reports
   RLS policy for admin updates
```

---

## Next: Run API Tests

Now you can run the curl commands from SPRINT_04_TEST_PLAN.md:

```bash
# Set your token
export TOKEN="eyJ..."

# Test 1: List reports
curl -X GET "http://localhost:3000/api/admin/reports" \
  -H "Authorization: Bearer $TOKEN"

# Test 2: Get report details
curl -X GET "http://localhost:3000/api/admin/reports/2026-07-18" \
  -H "Authorization: Bearer $TOKEN"

# Test 3: Approve
curl -X PUT "http://localhost:3000/api/admin/reports/2026-07-18/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approvedBy":"admin@test.local"}'

# etc...
```

---

## Troubleshooting

### Issue: "role column not found" error
**Solution:** Migrate was not applied. Manually run `003_admin_role.sql` via SQL Editor

### Issue: Cannot find auth-token cookie
**Solution:** User not signed in. Sign in first at `/register`, then check Application tab

### Issue: Token starts with "ey"
**Good!** That's the correct JWT format (Base64URL encoded)

### Issue: "User not admin" on API call
**Solution:** Verify role in database:
```sql
SELECT email, role FROM user_profiles WHERE email = 'admin@test.local';
```
Should show `role = 'admin'`

