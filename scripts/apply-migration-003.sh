#!/bin/bash

# Apply migration 003_admin_role.sql to Supabase
# Requires: SUPABASE_SERVICE_ROLE_KEY in environment or .env.local

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | xargs)
fi

# Verify environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing Supabase environment variables:"
  echo "   - NEXT_PUBLIC_SUPABASE_URL"
  echo "   - SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Read migration SQL
MIGRATION_SQL=$(cat supabase/migrations/003_admin_role.sql)

echo "📋 Applying migration to Supabase..."
echo "   URL: $SUPABASE_URL"

# Execute SQL via Supabase REST API
# Note: This requires the SQL endpoint to be available in your Supabase project
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql_string\": \"$(echo "$MIGRATION_SQL" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\"}" \
  2>&1)

# Check response
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Migration failed via REST API"
  echo ""
  echo "💡 Alternative: Apply manually via Supabase dashboard:"
  echo "   1. Go to https://app.supabase.com"
  echo "   2. Select your project"
  echo "   3. SQL Editor → New query"
  echo "   4. Paste contents of supabase/migrations/003_admin_role.sql"
  echo "   5. Execute"
  exit 1
fi

echo "✅ Migration applied successfully!"
echo ""
echo "📝 Changes applied:"
echo "   - Added 'role' column to user_profiles (default: 'user')"
echo "   - Created index on role column"
echo "   - Added RLS policy for admin updates on daily_reports"
echo "   - Added audit columns (approved_by, approved_at, rejected_by, rejected_at)"
