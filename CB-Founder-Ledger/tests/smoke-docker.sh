#!/usr/bin/env bash
# End-to-end smoke test against a RUNNING stack (default http://localhost:8080).
# Usage: SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... tests/smoke-docker.sh [base-url]
# Creates throwaway records tagged "[SMOKE]" (2 founders, 1 category, 1 transaction + receipt). The transaction is
# VOIDED at the end (transactions are never deleted) and the founders/category are deactivated.
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
check "admin may create category"      201 "$(code -b "$JAR_A" -X POST -H "$J" -d "{\"name\":\"[SMOKE] p1 $STAMP\"}" "$BASE/api/categories")"
check "invalid payload rejected"       400 "$(code -b "$JAR_A" -X POST -H "$J" -d '{"name":""}' "$BASE/api/categories")"
check "NoSQL operator rejected"        400 "$(code -X POST -H "$J" -d '{"email":{"$ne":null},"password":{"$ne":null}}' "$BASE/api/auth/login")"

# ---------------------------------------------------------------- Phase 2: transactions & receipts
id_of() { grep -o '"id":"[a-f0-9]\{24\}"' | head -1 | cut -d'"' -f4; }
post() { curl -s -b "$1" -X POST -H "$J" -d "$2" "$BASE$3"; }
# NOTE: login is rate limited (default 10 / 15 min / IP); this script performs 5 logins.
FA="$(post "$JAR_A" "{\"name\":\"[SMOKE] Founder A $STAMP\"}" /api/founders | id_of)"
FB="$(post "$JAR_A" "{\"name\":\"[SMOKE] Founder B $STAMP\"}" /api/founders | id_of)"
CAT="$(post "$JAR_A" "{\"name\":\"[SMOKE] tx-fixture $STAMP\"}" /api/categories | id_of)"
check "smoke fixtures created"          "yes" "$([ -n "$FA" ] && [ -n "$FB" ] && [ -n "$CAT" ] && echo yes || echo no)"
BASE_FAIR="$(curl -s -b "$JAR_F" "$BASE/api/founders/financial-positions" | grep -o '"totalFairShareMinor":[0-9-]*' | cut -d: -f2)"
BASE_EXP="$(curl -s -b "$JAR_F" "$BASE/api/dashboard" | grep -o '"totalBusinessExpensesMinor":[0-9-]*' | cut -d: -f2)"
check "config endpoint"                 200 "$(code -b "$JAR_A" "$BASE/api/config")"
TXBODY="{\"type\":\"business_expense\",\"amountMinor\":3000000,\"transactionDate\":\"2026-04-15\",\"description\":\"[SMOKE] expense $STAMP\",\"categoryId\":\"$CAT\",\"paidByFounderId\":\"$FA\",\"split\":{\"method\":\"equal\",\"entries\":[{\"founderId\":\"$FA\"},{\"founderId\":\"$FB\"}]}}"
check "unauthenticated create rejected" 401 "$(code -X POST -H "$J" -d "$TXBODY" "$BASE/api/transactions")"
TXRES="$(post "$JAR_F" "$TXBODY" /api/transactions)"
TX="$(echo "$TXRES" | id_of)"
check "founder creates expense"         "yes" "$([ -n "$TX" ] && echo yes || echo no)"
check "split resolved 15,000 each"      2 "$(echo "$TXRES" | grep -o '"allocatedMinor":1500000' | wc -l | tr -d ' ')"
check "invalid split rejected"          400 "$(code -b "$JAR_F" -X POST -H "$J" -d "${TXBODY/equal/percentage}" "$BASE/api/transactions")"
check "retrieve transaction"            200 "$(code -b "$JAR_F" "$BASE/api/transactions/$TX")"
check "list with filter"                200 "$(code -b "$JAR_F" "$BASE/api/transactions?type=business_expense&search=SMOKE")"
F2_EMAIL="smoke-founder2-$STAMP@example.test"; JAR_G="$(mktemp)"
post "$JAR_A" "{\"email\":\"$F2_EMAIL\",\"name\":\"Smoke Founder 2\",\"password\":\"$FOUNDER_PASSWORD\",\"role\":\"founder\"}" /api/users >/dev/null
code -c "$JAR_G" -X POST -H "$J" -d "{\"email\":\"$F2_EMAIL\",\"password\":\"$FOUNDER_PASSWORD\"}" "$BASE/api/auth/login" >/dev/null
check "non-owner founder cannot edit"   403 "$(code -b "$JAR_G" -X PATCH -H "$J" -d '{"expectedVersion":1,"description":"x"}' "$BASE/api/transactions/$TX")"
check "stale version -> 409"            409 "$(code -b "$JAR_F" -X PATCH -H "$J" -d '{"expectedVersion":99,"description":"x"}' "$BASE/api/transactions/$TX")"
check "edit with correct version"       200 "$(code -b "$JAR_F" -X PATCH -H "$J" -d '{"expectedVersion":1,"amountMinor":4500000}' "$BASE/api/transactions/$TX")"
check "hard delete refused"             405 "$(code -b "$JAR_A" -X DELETE "$BASE/api/transactions/$TX")"
# receipt: a minimal valid PNG header + padding
PNGFILE="$(mktemp --suffix=.png)"; printf '\x89PNG\r\n\x1a\n' > "$PNGFILE"; head -c 300 /dev/zero >> "$PNGFILE"
BADFILE="$(mktemp --suffix=.png)"; echo '<html>not an image</html>' > "$BADFILE"
check "receipt upload (founder/owner)"  201 "$(code -b "$JAR_F" -F "file=@$PNGFILE;type=image/png" "$BASE/api/transactions/$TX/receipts")"
check "spoofed receipt rejected"        415 "$(code -b "$JAR_F" -F "file=@$BADFILE;type=image/png" "$BASE/api/transactions/$TX/receipts")"
RID="$(curl -s -b "$JAR_F" "$BASE/api/transactions/$TX/receipts" | id_of)"
check "receipt metadata"                "yes" "$([ -n "$RID" ] && echo yes || echo no)"
check "anonymous receipt access"        401 "$(code "$BASE/api/transactions/$TX/receipts/$RID/file")"
check "authorised receipt access"       200 "$(code -b "$JAR_A" "$BASE/api/transactions/$TX/receipts/$RID/file")"
check "no public receipt path"          "no" "$(curl -s "$BASE/receipts/" -o /dev/null -w '%{content_type}' | grep -q 'image/png' && echo yes || echo no)"
check "founder cannot void"             403 "$(code -b "$JAR_F" -X POST -H "$J" -d '{"expectedVersion":2,"reason":"smoke test cleanup"}' "$BASE/api/transactions/$TX/void")"
check "admin voids (reversal)"          200 "$(code -b "$JAR_A" -X POST -H "$J" -d '{"expectedVersion":2,"reason":"smoke test cleanup"}' "$BASE/api/transactions/$TX/void")"
check "voided record still readable"    200 "$(code -b "$JAR_A" "$BASE/api/transactions/$TX")"
# ---------------------------------------------------------------- Phase 3 Option C: reimbursement validation (nothing can be approved before Phase 5,
# so the approved-expense path is exercised by tests/docker-reimbursement-e2e.sh, which approves via the database)
TX2="$(post "$JAR_F" "${TXBODY/\[SMOKE\] expense/[SMOKE] expense-2}" /api/transactions | id_of)"
RB="{\"type\":\"reimbursement\",\"amountMinor\":100000,\"transactionDate\":\"2026-05-03\",\"description\":\"[SMOKE] reimb $STAMP\",\"paidByFounderId\":\"$FA\""
check "reimbursement WITHOUT link rejected"      400 "$(code -b "$JAR_F" -X POST -H "$J" -d "$RB}" "$BASE/api/transactions")"
check "reimbursement -> unapproved expense"      400 "$(code -b "$JAR_F" -X POST -H "$J" -d "$RB,\"reimbursesTransactionId\":\"$TX2\"}" "$BASE/api/transactions")"
check "reimbursement -> unknown expense"         400 "$(code -b "$JAR_F" -X POST -H "$J" -d "$RB,\"reimbursesTransactionId\":\"64b7f0f0f0f0f0f0f0f0f0f0\"}" "$BASE/api/transactions")"
check "reimbursement -> malformed id"            400 "$(code -b "$JAR_F" -X POST -H "$J" -d "$RB,\"reimbursesTransactionId\":\"nope\"}" "$BASE/api/transactions")"
check "operator injection in link rejected"      400 "$(code -b "$JAR_F" -X POST -H "$J" -d "$RB,\"reimbursesTransactionId\":{\"\$ne\":null}}" "$BASE/api/transactions")"
check "expense cannot carry a link"              400 "$(code -b "$JAR_F" -X POST -H "$J" -d "${TXBODY%\}},\"reimbursesTransactionId\":\"$TX2\"}" "$BASE/api/transactions")"
check "reimbursable-expenses needs sign-in"      401 "$(code "$BASE/api/transactions/reimbursable-expenses?paidByFounderId=$FA")"
check "reimbursable-expenses needs founder id"   400 "$(code -b "$JAR_F" "$BASE/api/transactions/reimbursable-expenses")"
check "reimbursable-expenses lists none (unapproved)" '{"expenses":[]}' "$(curl -s -b "$JAR_F" "$BASE/api/transactions/reimbursable-expenses?paidByFounderId=$FA")"
check "voiding the unapproved test expense"      200 "$(code -b "$JAR_A" -X POST -H "$J" -d '{"expectedVersion":1,"reason":"smoke test cleanup"}' "$BASE/api/transactions/$TX2/void")"
# cleanup: deactivate every [SMOKE] founder and category (nothing is deleted)
for f in $(curl -s -b "$JAR_A" "$BASE/api/founders" | grep -o '"id":"[a-f0-9]\{24\}","name":"\[SMOKE\][^"]*"' | cut -d'"' -f4); do curl -s -o /dev/null -b "$JAR_A" -X PATCH -H "$J" -d '{"active":false}' "$BASE/api/founders/$f"; done
for c in $(curl -s -b "$JAR_A" "$BASE/api/categories" | grep -o '"id":"[a-f0-9]\{24\}","name":"\[SMOKE\][^"]*"' | cut -d'"' -f4); do curl -s -o /dev/null -b "$JAR_A" -X PATCH -H "$J" -d '{"active":false}' "$BASE/api/categories/$c"; done
rm -f "$PNGFILE" "$BADFILE" "$JAR_G"
# ---------------------------------------------------------------- Phase 3: calculation endpoints (read-only)
check "positions need sign-in"          401 "$(code "$BASE/api/founders/financial-positions")"
check "recommendations need sign-in"    401 "$(code "$BASE/api/settlements/recommendations")"
check "founder reads positions"         200 "$(code -b "$JAR_F" "$BASE/api/founders/financial-positions")"
check "positions include pending-excluded count" "yes" "$(curl -s -b "$JAR_F" "$BASE/api/founders/financial-positions" | grep -q '"excluded"' && echo yes || echo no)"
check "founder reads ledger"            200 "$(code -b "$JAR_F" "$BASE/api/founders/$FA/financial-position")"
check "unknown founder ledger"          404 "$(code -b "$JAR_F" "$BASE/api/founders/64b7f0f0f0f0f0f0f0f0f0f0/financial-position")"
check "recommendations"                 200 "$(code -b "$JAR_F" "$BASE/api/settlements/recommendations")"
check "settlement summary"              200 "$(code -b "$JAR_F" "$BASE/api/settlements/summary")"
check "client-supplied figures rejected" 400 "$(code -b "$JAR_F" "$BASE/api/settlements/summary?netPositionMinor=5")"
check "pending expense is NOT counted"  "$BASE_FAIR" "$(curl -s -b "$JAR_F" "$BASE/api/founders/financial-positions" | grep -o '"totalFairShareMinor":[0-9-]*' | cut -d: -f2)"
# ---------------------------------------------------------------- Phase 4: dashboard (read-only aggregate API)
check "dashboard needs sign-in"          401 "$(code "$BASE/api/dashboard")"
check "founder reads dashboard"          200 "$(code -b "$JAR_F" "$BASE/api/dashboard")"
check "dashboard period accepted"        200 "$(code -b "$JAR_F" "$BASE/api/dashboard?from=2026-01-01&to=2026-12-31")"
check "dashboard founder filter accepted" 200 "$(code -b "$JAR_F" "$BASE/api/dashboard?founderId=$FA")"
check "dashboard bad date rejected"      400 "$(code -b "$JAR_F" "$BASE/api/dashboard?from=2026-02-30")"
check "dashboard reversed period rejected" 400 "$(code -b "$JAR_F" "$BASE/api/dashboard?from=2026-05-02&to=2026-05-01")"
check "dashboard client totals rejected" 400 "$(code -b "$JAR_F" "$BASE/api/dashboard?totalBusinessExpensesMinor=1")"
check "dashboard operator injection rejected" 400 "$(code -b "$JAR_F" "$BASE/api/dashboard?founderId%5B%24ne%5D=1")"
check "dashboard unknown founder"        404 "$(code -b "$JAR_F" "$BASE/api/dashboard?founderId=64b7f0f0f0f0f0f0f0f0f0f0")"
check "dashboard has no write methods"   404 "$(code -b "$JAR_A" -X POST -H "$J" -d '{}' "$BASE/api/dashboard")"
check "dashboard pending expense not counted" "$BASE_EXP" "$(curl -s -b "$JAR_F" "$BASE/api/dashboard" | grep -o '"totalBusinessExpensesMinor":[0-9-]*' | cut -d: -f2)"
check "dashboard exposes no obsolete external fields" "no" "$(curl -s -b "$JAR_F" "$BASE/api/dashboard" | grep -qi 'external' && echo yes || echo no)"
# ---------------------------------------------------------------- Founder Ledger portal: settings, approvals, recurring, reports, audit, entry route
check "public branding needs no sign-in"  200 "$(code "$BASE/api/branding/public")"
check "public branding has a business name" "yes" "$(curl -s "$BASE/api/branding/public" | grep -q '"displayName"' && echo yes || echo no)"
check "logo endpoint serves an image"    "image/png" "$(curl -sL -o /dev/null -w '%{content_type}' "$BASE/api/branding/logo" | cut -d';' -f1)"
check "settings need sign-in"            401 "$(code "$BASE/api/settings")"
check "founder may READ settings (read-only)" 200 "$(code -b "$JAR_F" "$BASE/api/settings")"
check "admin reads settings"             200 "$(code -b "$JAR_A" "$BASE/api/settings")"
check "founder FORBIDDEN to change settings" 403 "$(code -b "$JAR_F" -X PATCH -H "$J" -d '{"expectedVersion":1,"values":{}}' "$BASE/api/settings")"
check "unknown settings key rejected"    400 "$(code -b "$JAR_A" -X PATCH -H "$J" -d '{"expectedVersion":1,"values":{"nope":1}}' "$BASE/api/settings")"
check "config carries settings"          "yes" "$(curl -s -b "$JAR_F" "$BASE/api/config" | grep -q '"settings"' && echo yes || echo no)"
check "approvals need sign-in"           401 "$(code "$BASE/api/approvals")"
check "founder reads approvals queue"    200 "$(code -b "$JAR_F" "$BASE/api/approvals?status=pending_approval")"
check "approvals bad status rejected"    400 "$(code -b "$JAR_F" "$BASE/api/approvals?status=%24ne")"
check "recurring needs sign-in"          401 "$(code "$BASE/api/recurring")"
check "founder reads recurring"          200 "$(code -b "$JAR_F" "$BASE/api/recurring")"
check "recurring write validates input" 400 "$(code -b "$JAR_F" -X POST -H "$J" -d '{}' "$BASE/api/recurring")"
check "recurring write needs sign-in" 401 "$(code -X POST -H "$J" -d '{}' "$BASE/api/recurring")"
check "reports need sign-in"             401 "$(code "$BASE/api/reports/summary")"
check "founder reads report summary"     200 "$(code -b "$JAR_F" "$BASE/api/reports/summary")"
check "report export is CSV"             "text/csv" "$(curl -s -b "$JAR_F" -o /dev/null -w '%{content_type}' "$BASE/api/reports/export?kind=summary" | cut -d';' -f1)"
check "report export bad kind rejected"  400 "$(code -b "$JAR_F" "$BASE/api/reports/export?kind=../etc")"
check "audit log needs sign-in"          401 "$(code "$BASE/api/audit-log")"
check "founder FORBIDDEN audit log"      403 "$(code -b "$JAR_F" "$BASE/api/audit-log")"
check "admin reads audit log"            200 "$(code -b "$JAR_A" "$BASE/api/audit-log")"
check "audit log recorded this run's login" "yes" "$(curl -s -b "$JAR_A" "$BASE/api/audit-log?action=LOGIN" | grep -q '"LOGIN"' && echo yes || echo no)"
check "audit log has no secrets"         "no" "$(curl -s -b "$JAR_A" "$BASE/api/audit-log?pageSize=100" | grep -qiE 'passwordHash|\$2[aby]\$|smoke-test-passphrase' && echo yes || echo no)"
check "founders in mandatory order"      "yes" "$(curl -s -b "$JAR_F" "$BASE/api/founders" | grep -o '"name":"[^"]*"' | grep -v SMOKE | head -3 | tr '\n' ' ' | grep -q 'Nishant.*Deepak.*Divyanshu' && echo yes || echo no)"
check "/ledger entry route serves the app" 200 "$(code "$BASE/ledger")"
check "founder photo needs sign-in"      401 "$(code "$BASE/api/founders/$FA/photo")"
check "no sign-in -> no photo upload"    401 "$(code -X PUT "$BASE/api/founders/$FA/photo")"
check "refresh works"                  200 "$(code -b "$JAR_A" -c "$JAR_A" -X POST "$BASE/api/auth/refresh")"
check "logout"                         204 "$(code -b "$JAR_A" -X POST "$BASE/api/auth/logout")"
check "after logout /me rejected"      401 "$(code -b "$JAR_A" "$BASE/api/auth/me")"
echo "----"; echo "passed=$pass failed=$fail"; [ "$fail" -eq 0 ]
