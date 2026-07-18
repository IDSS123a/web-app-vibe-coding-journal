# Auth Integration Notes — Sprint 04

**Status:** Token verification infrastructure complete. Waiting for Supabase auth session integration.

---

## What's Been Integrated

✅ **Backend (Server-side) — Complete**
- `lib/auth/verify-token.ts` — JWT verification + role extraction
- All admin API endpoints use `verifyAdminToken()` to check Bearer token
- Endpoints reject requests without valid admin role (401/403)

✅ **API Endpoints Protected**
- `GET /api/admin/reports` — Requires admin token
- `GET /api/admin/reports/[date]` — Requires admin token
- `PUT /api/admin/reports/[date]/approve` — Requires admin token + extracts approver email
- `PUT /api/admin/reports/[date]/reject` — Requires admin token + extracts rejector email

✅ **Database RLS** — Already in place
- `daily_reports` table: RLS policy allows admins to update review_status
- `user_profiles` table: role column defaults to 'user'

---

## What's Pending

### 1. Client-Side Auth Session (UI Components)

**Files needing auth integration:**
- `app/admin/review-queue/page.tsx` (line 31: Bearer token extraction)
- `app/admin/review-queue/[date]/page.tsx` (lines 32, 107, 118: Bearer token extraction)

**Pattern to implement once auth is set up:**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSupabaseSession } from '@/lib/auth/use-session'; // TODO: create this hook

export default function ReviewQueuePage() {
  const { session, user } = useSupabaseSession();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get Bearer token from Supabase session
    if (session) {
      const bearerToken = session.access_token;
      setToken(bearerToken);
    }
  }, [session]);

  async function fetchReports() {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    const response = await fetch(
      `/api/admin/reports?status=held_for_review&limit=${pageSize}&offset=${offset}`,
      {
        headers: {
          authorization: `Bearer ${token}`, // Use actual token from session
        },
      }
    );
    // ...
  }
}
```

### 2. Create Supabase Session Hook

**File to create:** `lib/auth/use-session.ts`

```ts
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/client'; // Use anon client for public access
import type { UserProfile } from '@/lib/validation/schemas';

export function useSupabaseSession() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session from Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Fetch user profile with role
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setUser(data))
          .catch(console.error);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return { session, user, loading };
}
```

### 3. Middleware Auth Check

**File:** `middleware.ts`

**Current status:** TODO placeholder in place

**When to implement:** After Supabase auth cookies are set up

```ts
// In middleware (server-side):
import { verifyAdminToken } from '@/lib/auth/verify-token';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Extract token from cookie or Authorization header
    const token = request.cookies.get('sb-access-token')?.value ||
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const verified = verifyAdminToken(`Bearer ${token}`);
    if (!verified) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}
```

---

## How Supabase Auth Works

1. **User registers/logs in** → Supabase creates session with JWT access_token
2. **Access token** contains user data (sub, email) but NOT custom claims (role)
3. **Role stored in database** → Must fetch from `user_profiles.role` table
4. **Admin token verification:**
   - Extract JWT from Authorization header
   - Decode JWT (verify signature + expiration)
   - Check user ID matches token sub
   - Query database for role
   - Allow if role == 'admin'

---

## Testing the Integration

### 1. Test Backend (No Auth Needed Yet)

```bash
# These should fail with 401 since no valid token provided
curl -X GET http://localhost:3000/api/admin/reports

# To test with token, first create admin user:
# 1. Go to Supabase dashboard → Authentication → Users
# 2. Create test user: admin@test.com / password
# 3. Go to SQL Editor, run:
#    UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@test.com';
# 4. Get JWT token from Supabase CLI:
#    supabase auth admin create-user --email admin@test.com --password PASSWORD
# 5. Extract access_token from response
# 6. Test endpoint:
curl -X GET http://localhost:3000/api/admin/reports \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Test UI (After Session Hook Implemented)

- Navigate to `/admin/review-queue`
- Should show list of held reports (or loading spinner)
- If not authenticated, should show error message
- Check browser console for network requests with Authorization header

---

## Checklist for Full Integration

- [ ] Create `lib/auth/use-session.ts` hook
- [ ] Update `app/admin/review-queue/page.tsx` to use session hook
- [ ] Update `app/admin/review-queue/[date]/page.tsx` to use session hook
- [ ] Update `middleware.ts` with token extraction from cookies
- [ ] Create test admin user in Supabase
- [ ] Test API endpoints with valid JWT token
- [ ] Test UI pages with logged-in admin user
- [ ] Verify role-based access control (non-admins redirected)
- [ ] Test token expiration handling
- [ ] Document findings in corrections/SPRINT_04_LESSONS.md

---

## Architecture Decision

**Why not verify in middleware only?**
- Middleware runs on every request (overhead)
- API endpoints should be defensive (verify their own access)
- E-4: Defense in depth (multiple layers of auth)

**Why extract on token, not always from database?**
- Performance: JWT decode is O(1), database lookup is O(log n)
- Availability: Works even if database is slow/down (for short window)
- Token expiration: JWT has built-in expiry, database doesn't

**When to use database lookup?**
- Revoking admin access immediately (must query DB)
- Auditing who changed what (must use verified.email from token + store in DB)
- Permission changes (token has role, DB has current role)

---

## Security Considerations

1. **Token signature verification** — `jwtDecode` does NOT verify signature (use `jose` library if needed)
   - For MVP: Trust Supabase to issue signed tokens
   - Production: Add signature verification

2. **Token expiration** — JWT has `exp` claim, checked in `verifySupabaseToken()`
   - Refresh token flow: When expired, use refresh_token to get new access_token
   - TODO: Implement refresh logic in session hook

3. **CORS** — Admin API endpoints exposed to browser (CORS headers needed)
   - Next.js handles this automatically (same-origin requests)
   - External requests blocked by browser (good)

4. **HTTPS Only** — Tokens should only be sent over HTTPS in production
   - `Secure` cookie flag (set by Supabase)
   - No token in URL (use header or cookie)

---

## Reference

- Supabase JWT: https://supabase.com/docs/guides/auth/jwts
- jwt-decode library: https://github.com/auth0/jwt-decode
- Role-based access: https://supabase.com/docs/guides/auth/row-level-security

