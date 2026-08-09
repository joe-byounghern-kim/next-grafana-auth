#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
EXAMPLES_DIR="$REPO_ROOT/examples"
COMPOSE_FILE="$EXAMPLES_DIR/docker-compose.yml"

fail() {
  echo "Error: $*" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail "Node.js is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"
command -v curl >/dev/null 2>&1 || fail "curl is required"
command -v docker >/dev/null 2>&1 || fail "Docker is required"
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required"

IFS=. read -r node_major node_minor node_patch <<EOF
$(node -p 'process.versions.node')
EOF
node_patch="${node_patch%%-*}"
node_allowed=0
if [ "$node_major" -eq 22 ] && { [ "$node_minor" -gt 22 ] || { [ "$node_minor" -eq 22 ] && [ "$node_patch" -ge 2 ]; }; }; then
  node_allowed=1
elif [ "$node_major" -eq 24 ] && { [ "$node_minor" -gt 15 ] || { [ "$node_minor" -eq 15 ] && [ "$node_patch" -ge 0 ]; }; }; then
  node_allowed=1
elif [ "$node_major" -ge 26 ]; then
  node_allowed=1
fi
[ "$node_allowed" -eq 1 ] || fail "Node.js ^22.22.2 || ^24.15.0 || >=26.0.0 is required"

IFS=. read -r npm_major npm_minor npm_patch <<EOF
$(npm --version)
EOF
npm_patch="${npm_patch%%-*}"
[ "$npm_major" -eq 12 ] || fail "npm 12.0.2 or a newer npm 12 patch is required"
if [ "$npm_minor" -eq 0 ] && [ "$npm_patch" -lt 2 ]; then
  fail "npm 12.0.2 or newer is required"
fi

compose() {
  docker compose --project-directory "$EXAMPLES_DIR" -f "$COMPOSE_FILE" "$@"
}

echo "Installing and building the root package..."
(cd "$REPO_ROOT" && npm ci && npm run build)

echo "Installing the sandbox..."
(cd "$SCRIPT_DIR" && npm ci)

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo "Created sandbox/.env"
fi

if [ "${KEEP_GRAFANA_DATA:-0}" != "1" ]; then
  compose down -v >/dev/null 2>&1 || true
fi

compose up -d
GRAFANA_BASE_URL=http://localhost:3001/api/grafana "$REPO_ROOT/scripts/verify-grafana.sh"

if [ "${QUICK_START_VERIFY_ONLY:-0}" = "1" ]; then
  echo "Building and starting the sandbox for clean-clone verification..."
  (cd "$SCRIPT_DIR" && GRAFANA_INTERNAL_URL=http://localhost:3001 npm run build)
  (
    cd "$SCRIPT_DIR"
    exec env GRAFANA_INTERNAL_URL=http://localhost:3001 npm run start -- --port 3000
  ) &
  app_pid=$!
  cleanup_app() {
    kill "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  }
  trap cleanup_app EXIT INT TERM
  APP_PID="$app_pid" APP_BASE_URL=http://localhost:3000 "$REPO_ROOT/scripts/verify-grafana.sh"
  cleanup_app
  trap - EXIT INT TERM
  echo "Clean-clone sandbox validation passed"
  exit 0
fi

echo "Sandbox is ready at http://localhost:3000"
echo "Stop Grafana with: docker compose --project-directory \"$EXAMPLES_DIR\" -f \"$COMPOSE_FILE\" down"
cd "$SCRIPT_DIR"
exec npm run dev
