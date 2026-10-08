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
# cleanup: deactivate every [SMOKE] founder and category (nothing is deleted)
for f in $(curl -s -b "$JAR_A" "$BASE/api/founders" | grep -o '"id":"[a-f0-9]\{24\}","name":"\[SMOKE\][^"]*"' | cut -d'"' -f4); do curl -s -o /dev/null -b "$JAR_A" -X PATCH -H "$J" -d '{"active":false}' "$BASE/api/founders/$f"; done
for c in $(curl -s -b "$JAR_A" "$BASE/api/categories" | grep -o '"id":"[a-f0-9]\{24\}","name":"\[SMOKE\][^"]*"' | cut -d'"' -f4); do curl -s -o /dev/null -b "$JAR_A" -X PATCH -H "$J" -d '{"active":false}' "$BASE/api/categories/$c"; done
rm -f "$PNGFILE" "$BADFILE" "$JAR_G"
check "refresh works"                  200 "$(code -b "$JAR_A" -c "$JAR_A" -X POST "$BASE/api/auth/refresh")"
check "logout"                         204 "$(code -b "$JAR_A" -X POST "$BASE/api/auth/logout")"
check "after logout /me rejected"      401 "$(code -b "$JAR_A" "$BASE/api/auth/me")"
echo "----"; echo "passed=$pass failed=$fail"; [ "$fail" -eq 0 ]
