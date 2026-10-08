#!/usr/bin/env bash
# End-to-end smoke test against a RUNNING stack (default http://localhost:8080).
# Usage: SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... tests/smoke-docker.sh [base-url]
# Creates one throwaway founder user and one category; creates NO financial data.
set -uo pipefail
BASE="${1:-http://localhost:8080}"
ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:?set SMOKE_ADMIN_EMAIL}"
ADMIN_PASSWORD="${SMOKE_ADMIN_PASSWORD:?set SMOKE_ADMIN_PASSWORD}"
STAMP="$(date +%s)"
FOUNDER_EMAIL="smoke-founder-$STAMP@example.test"
FOUNDER_PASSWORD="smoke-test-passphrase-123"
JAR_A="$(mktemp)"; JAR_F="$(mktemp)"; trap 'rm -f "$JAR_A" "$JAR_F"' EXIT
pass=0; fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS  $1 ($3)"; pass=$((pass+1)); else echo "FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
J='Content-Type: application/json'

check "health endpoint"                200 "$(code "$BASE/api/health")"
check "health reports db connected"    '"db":"connected"' "$(curl -s "$BASE/api/health" | grep -o '"db":"connected"')"
check "web app served"                 200 "$(code "$BASE/")"
check "unauthenticated /me rejected"   401 "$(code "$BASE/api/auth/me")"
check "unauthenticated /founders"      401 "$(code "$BASE/api/founders")"
check "bad password rejected"          401 "$(code -X POST -H "$J" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-password-xx\"}" "$BASE/api/auth/login")"
check "admin login"                    200 "$(code -c "$JAR_A" -X POST -H "$J" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" "$BASE/api/auth/login")"
check "admin /me"                      200 "$(code -b "$JAR_A" "$BASE/api/auth/me")"
check "admin lists users"              200 "$(code -b "$JAR_A" "$BASE/api/users")"
check "admin creates founder user"     201 "$(code -b "$JAR_A" -X POST -H "$J" -d "{\"email\":\"$FOUNDER_EMAIL\",\"name\":\"Smoke Founder\",\"password\":\"$FOUNDER_PASSWORD\",\"role\":\"founder\"}" "$BASE/api/users")"
check "founder login"                  200 "$(code -c "$JAR_F" -X POST -H "$J" -d "{\"email\":\"$FOUNDER_EMAIL\",\"password\":\"$FOUNDER_PASSWORD\"}" "$BASE/api/auth/login")"
check "founder may read founders"      200 "$(code -b "$JAR_F" "$BASE/api/founders")"
check "founder FORBIDDEN list users"   403 "$(code -b "$JAR_F" "$BASE/api/users")"
check "founder FORBIDDEN create cat."  403 "$(code -b "$JAR_F" -X POST -H "$J" -d '{"name":"X"}' "$BASE/api/categories")"
check "admin may create category"      201 "$(code -b "$JAR_A" -X POST -H "$J" -d "{\"name\":\"Smoke $STAMP\"}" "$BASE/api/categories")"
check "invalid payload rejected"       400 "$(code -b "$JAR_A" -X POST -H "$J" -d '{"name":""}' "$BASE/api/categories")"
check "NoSQL operator rejected"        400 "$(code -X POST -H "$J" -d '{"email":{"$ne":null},"password":{"$ne":null}}' "$BASE/api/auth/login")"
check "refresh works"                  200 "$(code -b "$JAR_A" -c "$JAR_A" -X POST "$BASE/api/auth/refresh")"
check "logout"                         204 "$(code -b "$JAR_A" -X POST "$BASE/api/auth/logout")"
check "after logout /me rejected"      401 "$(code -b "$JAR_A" "$BASE/api/auth/me")"
echo "----"; echo "passed=$pass failed=$fail"; [ "$fail" -eq 0 ]
