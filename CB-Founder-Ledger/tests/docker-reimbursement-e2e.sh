#!/usr/bin/env bash
# Option C end-to-end against a RUNNING Docker stack: reimbursement -> calculation -> settlement guards.
# Approval belongs to Phase 5, so this script approves records with a direct MongoDB write (inside the compose network;
# MongoDB is never published). It needs docker compose access. Everything it creates is tagged "[E2E]"; run it against a
# disposable stack (`docker compose down -v` afterwards) — it voids what it can, but approved test expenses stay in the ledger.
# Usage: SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... tests/docker-reimbursement-e2e.sh [base-url]
set -uo pipefail
BASE="${1:-http://localhost:8080}"
ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:?set SMOKE_ADMIN_EMAIL}"; ADMIN_PASSWORD="${SMOKE_ADMIN_PASSWORD:?set SMOKE_ADMIN_PASSWORD}"
C="docker compose --env-file .env -f docker/docker-compose.yml"
JAR="$(mktemp)"; trap 'rm -f "$JAR"' EXIT
J='Content-Type: application/json'; STAMP="$(date +%s)"
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then echo "PASS  $1 ($3)"; pass=$((pass+1)); else echo "FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi; }
req() { curl -s -b "$JAR" -H "$J" "$@"; }
jget() { python3 -c 'import json,sys; d=json.load(sys.stdin)
for k in sys.argv[1].split("."):
    d = d[int(k)] if k.isdigit() else d.get(k) if isinstance(d, dict) else None
    if d is None: break
print("" if d is None else d)' "$1"; }
approve() { $C exec -T mongo mongosh --quiet -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin cb_founder_ledger --eval "db.transactions.updateOne({_id: ObjectId('$1')}, {\$set: {status: 'approved'}}).modifiedCount" | tail -1; }
MONGO_ROOT_USERNAME="$(grep '^MONGO_ROOT_USERNAME=' .env | cut -d= -f2-)"; MONGO_ROOT_PASSWORD="$(grep '^MONGO_ROOT_PASSWORD=' .env | cut -d= -f2-)"

check "login" 200 "$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -X POST -H "$J" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" "$BASE/api/auth/login")"
FA="$(req -X POST -d "{\"name\":\"[E2E] A $STAMP\"}" "$BASE/api/founders" | jget founder.id)"
FB="$(req -X POST -d "{\"name\":\"[E2E] B $STAMP\"}" "$BASE/api/founders" | jget founder.id)"
FC="$(req -X POST -d "{\"name\":\"[E2E] C $STAMP\"}" "$BASE/api/founders" | jget founder.id)"
CAT="$(req -X POST -d "{\"name\":\"[E2E] cat $STAMP\"}" "$BASE/api/categories" | jget category.id)"
EXP="$(req -X POST -d "{\"type\":\"business_expense\",\"amountMinor\":300000,\"transactionDate\":\"2026-04-15\",\"description\":\"[E2E] hosting\",\"categoryId\":\"$CAT\",\"paidByFounderId\":\"$FA\",\"split\":{\"method\":\"equal\",\"entries\":[{\"founderId\":\"$FA\"},{\"founderId\":\"$FB\"},{\"founderId\":\"$FC\"}]}}" "$BASE/api/transactions" | jget transaction.id)"
RB() { echo "{\"type\":\"reimbursement\",\"amountMinor\":$1,\"transactionDate\":\"2026-05-03\",\"description\":\"[E2E] reimb\",\"paidByFounderId\":\"${3:-$FA}\",\"reimbursesTransactionId\":\"$2\"}"; }
check "fixtures created"                                  yes "$([ -n "$FA$FB$FC$CAT$EXP" ] && echo yes || echo no)"
check "pending expense cannot be reimbursed"              400 "$(req -o /dev/null -w '%{http_code}' -X POST -d "$(RB 100000 "$EXP")" "$BASE/api/transactions")"
check "approve expense (direct DB write, Phase 5 owns approval)" 1 "$(approve "$EXP")"
check "payer mismatch rejected"                           400 "$(req -o /dev/null -w '%{http_code}' -X POST -d "$(RB 100000 "$EXP" "$FB")" "$BASE/api/transactions")"
check "picker lists the expense (remaining 300000)"       300000 "$(req "$BASE/api/transactions/reimbursable-expenses?paidByFounderId=$FA" | jget expenses.0.remainingMinor)"
R1="$(req -X POST -d "$(RB 100000 "$EXP")" "$BASE/api/transactions" | jget transaction.id)"
check "reimbursement of 1,000 of 3,000 created"           yes "$([ -n "$R1" ] && echo yes || echo no)"
check "approve reimbursement"                             1 "$(approve "$R1")"
check "expense now reports reimbursed 100000"             100000 "$(req "$BASE/api/transactions/$EXP" | jget transaction.reimbursedMinor)"
POS="$(req "$BASE/api/founders/financial-positions")"
check "business-borne 100000"                             100000 "$(echo "$POS" | jget reconciliation.businessBorneMinor)"
check "Σ net positions = 0"                               0 "$(echo "$POS" | jget reconciliation.sumGrossNetPositionMinor)"
check "founder A paid 200000 / fair 66667 / net 133333"   "200000/66667/133333" "$(echo "$POS" | python3 -c 'import json,sys; p=[x for x in json.load(sys.stdin)["positions"] if x["founderId"]=="'$FA'"][0]; print("%s/%s/%s"%(p["paidMinor"],p["fairShareMinor"],p["grossNetPositionMinor"]))')"
check "reconciliation PASS"                               PASS "$(echo "$POS" | jget reconciliation.status)"
REC="$(req "$BASE/api/settlements/recommendations")"
check "recommendations: 66667 + 66666 to A"               "66667,66666" "$(echo "$REC" | python3 -c 'import json,sys; print(",".join(str(r["amountMinor"]) for r in json.load(sys.stdin)["recommendations"]))')"
OVER="$(req -X POST -d "$(RB 250000 "$EXP")" "$BASE/api/transactions")"
check "over-reimbursement (2,500 > 2,000 left) rejected"  REIMBURSEMENT_EXCEEDS_EXPENSE "$(echo "$OVER" | jget error.code)"
check "...with the remaining amount"                      200000 "$(echo "$OVER" | jget error.details.0.remainingMinor)"
V="$(req -X POST -d '{"expectedVersion":1,"reason":"e2e guard check"}' "$BASE/api/transactions/$EXP/void")"
check "expense void blocked while reimbursement active"   HAS_LINKED_REIMBURSEMENTS "$(echo "$V" | jget error.code)"
check "voiding the reimbursement"                         200 "$(req -o /dev/null -w '%{http_code}' -X POST -d '{"expectedVersion":1,"reason":"e2e restore check"}' "$BASE/api/transactions/$R1/void")"
POS="$(req "$BASE/api/founders/financial-positions")"
check "founder-funded amount restored (business-borne 0)" 0 "$(echo "$POS" | jget reconciliation.businessBorneMinor)"
check "reimbursement record still exists (voided)"        voided "$(req "$BASE/api/transactions/$R1" | jget transaction.status)"
check "expense reservation released"                      0 "$(req "$BASE/api/transactions/$EXP" | jget transaction.reimbursedMinor)"
check "expense can now be voided"                         200 "$(req -o /dev/null -w '%{http_code}' -X POST -d '{"expectedVersion":1,"reason":"e2e cleanup"}' "$BASE/api/transactions/$EXP/void")"
for f in "$FA" "$FB" "$FC"; do req -o /dev/null -X PATCH -d '{"active":false}' "$BASE/api/founders/$f"; done
req -o /dev/null -X PATCH -d '{"active":false}' "$BASE/api/categories/$CAT"
echo "----"; echo "passed=$pass failed=$fail"; [ "$fail" -eq 0 ]
