#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$REPO_ROOT/examples/custom-session"
APP_PORT="${APP_PORT:-3100}"
APP_BASE_URL="${APP_BASE_URL:-http://127.0.0.1:${APP_PORT}}"
GRAFANA_INTERNAL_URL="${GRAFANA_INTERNAL_URL:-http://127.0.0.1:3001}"
SCRATCH_DIR="${JCODE_SCRATCH_DIR:?JCODE_SCRATCH_DIR is required}"
LOG_FILE="$SCRATCH_DIR/custom-session-runtime.log"
HEADERS_FILE="$SCRATCH_DIR/custom-session-signin.headers"
BODY_FILE="$SCRATCH_DIR/custom-session-response.json"
ROUTE_FILE="$APP_DIR/app/api/grafana/[...path]/route.ts"

node - "$ROUTE_FILE" <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const source = fs.readFileSync(process.argv[2], 'utf8')
const exportBlock = source.match(/export\s*\{([^}]*)\}/s)
assert.ok(exportBlock, 'Custom Session Grafana route export block is missing')
const methods = exportBlock[1].split(',').map((specifier) => {
  const match = specifier.trim().match(/^handler\s+as\s+(GET|POST|PUT|PATCH|DELETE)$/)
  assert.ok(match, `unexpected Custom Session route export: ${specifier.trim()}`)
  return match[1]
})
assert.deepEqual(methods.sort(), ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'])
NODE

(
  cd "$APP_DIR"
  exec env GRAFANA_INTERNAL_URL="$GRAFANA_INTERNAL_URL" npm run start -- --hostname 127.0.0.1 --port "$APP_PORT"
) >"$LOG_FILE" 2>&1 &
app_pid=$!
cleanup() {
  kill "$app_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ready=0
for attempt in $(seq 1 60); do
  if ! kill -0 "$app_pid" 2>/dev/null; then
    cat "$LOG_FILE" >&2
    echo "Custom Session application exited before becoming ready" >&2
    exit 1
  fi
  status="$(curl -s -o "$BODY_FILE" -w '%{http_code}' "$APP_BASE_URL/api/auth/user" || true)"
  if [ "$status" = "401" ]; then
    ready=1
    break
  fi
  sleep 1
done
[ "$ready" -eq 1 ] || { echo "Custom Session application did not become ready" >&2; exit 1; }

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H 'Content-Type: application/json' -d '{}' "$APP_BASE_URL/api/auth/signin")"
[ "$status" = "400" ]
grep -Eq '"error"[[:space:]]*:[[:space:]]*"Email and password are required"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"wrong"}' "$APP_BASE_URL/api/auth/signin")"
[ "$status" = "401" ]
grep -Eq '"error"[[:space:]]*:[[:space:]]*"Invalid credentials"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' "$APP_BASE_URL/api/grafana/api/health")"
[ "$status" = "401" ]

status="$(curl -sS -D "$HEADERS_FILE" -o "$BODY_FILE" -w '%{http_code}' -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"admin123"}' "$APP_BASE_URL/api/auth/signin")"
[ "$status" = "200" ]
grep -Eq '"success"[[:space:]]*:[[:space:]]*true' "$BODY_FILE"
cookie_line="$(grep -i '^set-cookie: sessionId=' "$HEADERS_FILE" | tr -d '\r' | head -n 1)"
for attribute in HttpOnly Secure SameSite=lax Max-Age=86400 Path=/; do
  case "$cookie_line" in
    *"$attribute"*) ;;
    *) echo "Session cookie is missing $attribute: $cookie_line" >&2; exit 1 ;;
  esac
done
session_id="$(printf '%s\n' "$cookie_line" | sed -E 's/^[^:]+: sessionId=([^;]+).*/\1/')"
[ -n "$session_id" ]

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/auth/user")"
[ "$status" = "200" ]
grep -Eq '"email"[[:space:]]*:[[:space:]]*"admin@example.com"' "$BODY_FILE"
grep -Eq '"role"[[:space:]]*:[[:space:]]*"Admin"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/grafana/api/health")"
[ "$status" = "200" ]
grep -Eq '"database"[[:space:]]*:[[:space:]]*"ok"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -X POST -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/auth/signout")"
[ "$status" = "200" ]
grep -Eq '"success"[[:space:]]*:[[:space:]]*true' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/auth/user")"
[ "$status" = "401" ]
status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/grafana/api/health")"
[ "$status" = "401" ]

cleanup
trap - EXIT INT TERM
echo "Custom Session route validation passed"
