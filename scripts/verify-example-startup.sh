#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
APP_DIR="${1:?usage: verify-example-startup.sh <examples/basic|examples/custom-session|examples/nextauth>}"
SCRATCH_DIR="${JCODE_SCRATCH_DIR:?JCODE_SCRATCH_DIR is required}"

case "$APP_DIR" in
  examples/basic)
    default_port=3201
    readiness_path=/
    expected_status=200
    ;;
  examples/custom-session)
    default_port=3202
    readiness_path=/api/auth/user
    expected_status=401
    ;;
  examples/nextauth)
    default_port=3203
    readiness_path=/api/auth/providers
    expected_status=200
    ;;
  *)
    echo "unsupported documented example: $APP_DIR" >&2
    exit 2
    ;;
esac

app_name="${APP_DIR##*/}"
app_port="${APP_PORT:-$default_port}"
app_base_url="http://127.0.0.1:${app_port}"
log_file="$SCRATCH_DIR/${app_name}-documented-workflow.log"
body_file="$SCRATCH_DIR/${app_name}-documented-workflow.body"

(
  cd "$REPO_ROOT"
  exec env \
    GRAFANA_INTERNAL_URL="${GRAFANA_INTERNAL_URL:-http://127.0.0.1:3001}" \
    NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-documented-workflow-smoke-secret}" \
    NEXTAUTH_URL="$app_base_url" \
    npm run dev --prefix "$APP_DIR" -- --hostname 127.0.0.1 --port "$app_port"
) >"$log_file" 2>&1 &
app_pid=$!
cleanup() {
  kill "$app_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ready=0
for attempt in $(seq 1 90); do
  if ! kill -0 "$app_pid" 2>/dev/null; then
    cat "$log_file" >&2
    echo "$APP_DIR exited before becoming ready" >&2
    exit 1
  fi
  status="$(curl -s -o "$body_file" -w '%{http_code}' "$app_base_url$readiness_path" || true)"
  if [ "$status" = "$expected_status" ]; then
    ready=1
    break
  fi
  sleep 1
done
[ "$ready" -eq 1 ] || { cat "$log_file" >&2; echo "$APP_DIR did not become ready" >&2; exit 1; }

if [ "$APP_DIR" = "examples/nextauth" ]; then
  grep -Eq '"credentials"[[:space:]]*:' "$body_file"
  grep -Fq "\"signinUrl\":\"$app_base_url/api/auth/signin/credentials\"" "$body_file"
  grep -Fq "\"callbackUrl\":\"$app_base_url/api/auth/callback/credentials\"" "$body_file"
fi

cleanup
trap - EXIT INT TERM
echo "$APP_DIR documented startup validation passed"
