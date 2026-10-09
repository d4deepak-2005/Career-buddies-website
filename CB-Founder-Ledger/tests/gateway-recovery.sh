#!/usr/bin/env bash
# Regression check for QA finding PERS-07: after the API and database containers are restarted together (which can give
# the API a new IP address), the web gateway must keep reaching the API WITHOUT being restarted itself.
# Usage: WEB_PORT=8090 ... tests/gateway-recovery.sh <compose-project> [base-url]
# Safe to run against a throw-away stack. Do NOT point it at a stack holding data you cannot afford a restart of.
set -uo pipefail
P="${1:?compose project name}"; BASE="${2:-http://localhost:${WEB_PORT:-8080}}"
C=(docker compose --env-file .env -f docker/docker-compose.yml -p "$P")
echo "before: $(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/health")"
"${C[@]}" restart server mongo >/dev/null 2>&1
ok=no; for i in $(seq 40); do [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/health")" = 200 ] && { ok=yes; break; }; sleep 2; done
echo "gateway healthy again without restarting it: $ok"
[ "$ok" = yes ]
