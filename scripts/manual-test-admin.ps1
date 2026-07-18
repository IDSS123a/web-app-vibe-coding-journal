# Manual end-to-end test for the Sprint 04 admin API.
# Usage:
#   1. Start the dev server:  npm run dev   (note the port it prints, e.g. 3000)
#   2. Run:  .\scripts\manual-test-admin.ps1 -Port 3000
#
# Reads secrets from .env.local — nothing sensitive is hardcoded here.

param(
  [int]$Port = 3000,
  [string]$AdminEmail = "admin@test.local",
  [string]$AdminPassword = "TestPassword123!",
  [string]$UserEmail = "user@test.local",
  [string]$UserPassword = "TestPassword123!"
)

$ErrorActionPreference = "Stop"
$base = "http://localhost:$Port"
$pass = 0
$fail = 0

function Check($name, $condition, $detail) {
  if ($condition) {
    Write-Host "  [PASS] $name" -ForegroundColor Green
    $script:pass++
  } else {
    Write-Host "  [FAIL] $name  --  $detail" -ForegroundColor Red
    $script:fail++
  }
}

# --- Load .env.local ---
$envPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envPath)) { throw "Cannot find .env.local at $envPath" }
$envVars = @{}
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') { $envVars[$matches[1].Trim()] = $matches[2].Trim() }
}
$supabaseUrl = $envVars["NEXT_PUBLIC_SUPABASE_URL"]
$anonKey     = $envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
$serviceKey  = $envVars["SUPABASE_SERVICE_ROLE_KEY"]

Write-Host "`nSupabase: $supabaseUrl" -ForegroundColor Cyan
Write-Host "Target:   $base`n" -ForegroundColor Cyan

# --- Server reachable? ---
try {
  Invoke-WebRequest -Uri "$base/api/admin/reports" -Method GET -UseBasicParsing -ErrorAction Stop | Out-Null
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 401) {
    throw "Dev server not reachable on port $Port. Start it with 'npm run dev' and pass the right -Port."
  }
}

function Get-Token($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $resp = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
    -Method POST -Headers @{ "apikey" = $anonKey; "Content-Type" = "application/json" } -Body $body
  return $resp.access_token
}

function New-HeldReport($date) {
  $body = @{ date=$date; markdown="# Manual test $date"; reading_time_minutes=3; article_count=1; sections=@("Summary"); review_status="held_for_review" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/daily_reports" -Method POST `
    -Headers @{ "apikey"=$serviceKey; "Authorization"="Bearer $serviceKey"; "Content-Type"="application/json"; "Prefer"="resolution=merge-duplicates" } `
    -Body $body | Out-Null
}

# =============================================================
Write-Host "Signing in as admin..." -ForegroundColor Yellow
$adminToken = Get-Token $AdminEmail $AdminPassword
$adminHeaders = @{ "Authorization" = "Bearer $adminToken"; "Content-Type" = "application/json" }

# Seed two held reports (idempotent via merge-duplicates)
New-HeldReport "2026-08-01"
New-HeldReport "2026-08-02"
Write-Host "Seeded held reports 2026-08-01 / 2026-08-02`n"

Write-Host "TEST 1 - List held reports" -ForegroundColor Yellow
$r1 = Invoke-RestMethod -Uri "$base/api/admin/reports?status=held_for_review" -Method GET -Headers $adminHeaders
Check "returns success"          ($r1.success -eq $true) "success=$($r1.success)"
Check "at least one held report" ($r1.total -ge 1)       "total=$($r1.total)"

Write-Host "`nTEST 2 - Report details" -ForegroundColor Yellow
$r2 = Invoke-RestMethod -Uri "$base/api/admin/reports/2026-08-01" -Method GET -Headers $adminHeaders
Check "returns the requested date" ($r2.date -eq "2026-08-01") "date=$($r2.date)"
Check "status is held_for_review"  ($r2.report.review_status -eq "held_for_review") "status=$($r2.report.review_status)"

Write-Host "`nTEST 3 - Approve" -ForegroundColor Yellow
$r3 = Invoke-RestMethod -Uri "$base/api/admin/reports/2026-08-01/approve" -Method PUT -Headers $adminHeaders -Body "{}"
Check "status -> manually_approved" ($r3.report.review_status -eq "manually_approved") "status=$($r3.report.review_status)"
Check "approved_by = admin email"   ($r3.report.approved_by -eq $AdminEmail)            "approved_by=$($r3.report.approved_by)"
Check "approved_at is set"          ($null -ne $r3.report.approved_at)                  "approved_at empty"

Write-Host "`nTEST 4 - Reject" -ForegroundColor Yellow
$rejBody = @{ reason = "manual test rejection" } | ConvertTo-Json
$r4 = Invoke-RestMethod -Uri "$base/api/admin/reports/2026-08-02/reject" -Method PUT -Headers $adminHeaders -Body $rejBody
Check "status -> rejected"        ($r4.report.review_status -eq "rejected") "status=$($r4.report.review_status)"
Check "rejected_by = admin email" ($r4.report.rejected_by -eq $AdminEmail)  "rejected_by=$($r4.report.rejected_by)"
Check "rejected_at is set"        ($null -ne $r4.report.rejected_at)        "rejected_at empty"

Write-Host "`nTEST 5 - No token is rejected" -ForegroundColor Yellow
try {
  Invoke-WebRequest -Uri "$base/api/admin/reports" -Method GET -UseBasicParsing | Out-Null
  Check "401 without token" $false "got 200"
} catch {
  Check "401 without token" ($_.Exception.Response.StatusCode.value__ -eq 401) "got $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "`nTEST 6 - Non-admin token is rejected" -ForegroundColor Yellow
try {
  $userToken = Get-Token $UserEmail $UserPassword
  try {
    Invoke-WebRequest -Uri "$base/api/admin/reports" -Method GET -Headers @{ "Authorization" = "Bearer $userToken" } -UseBasicParsing | Out-Null
    Check "401 for non-admin" $false "got 200"
  } catch {
    Check "401 for non-admin" ($_.Exception.Response.StatusCode.value__ -eq 401) "got $($_.Exception.Response.StatusCode.value__)"
  }
} catch {
  Write-Host "  [SKIP] non-admin user not found (create user@test.local with role=user to run this)" -ForegroundColor DarkYellow
}

# =============================================================
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host " RESULTS:  $pass passed, $fail failed" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan
if ($fail -gt 0) { exit 1 } else { exit 0 }
