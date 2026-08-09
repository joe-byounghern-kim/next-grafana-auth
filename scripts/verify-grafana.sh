#!/usr/bin/env bash
set -euo pipefail

GRAFANA_BASE_URL="${GRAFANA_BASE_URL:-http://localhost:3001/api/grafana}"
APP_BASE_URL="${APP_BASE_URL:-}"
APP_PID="${APP_PID:-}"
AUTH_USER="${AUTH_USER:-demo@example.com}"
AUTH_ROLE="${AUTH_ROLE:-Viewer}"
GRAFANA_BASE_URL="${GRAFANA_BASE_URL%/}"
APP_BASE_URL="${APP_BASE_URL%/}"

request_grafana() {
  curl -fsS \
    -H "X-WEBAUTH-USER: ${AUTH_USER}" \
    -H "X-WEBAUTH-ROLE: ${AUTH_ROLE}" \
    "$@"
}

ready=0
for attempt in $(seq 1 90); do
  if request_grafana "${GRAFANA_BASE_URL}/api/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [ "$ready" -ne 1 ]; then
  echo "Grafana did not become healthy at ${GRAFANA_BASE_URL}" >&2
  exit 1
fi

datasource_response="$(request_grafana "${GRAFANA_BASE_URL}/api/datasources/uid/testdata")"
grep -Eq '"uid"[[:space:]]*:[[:space:]]*"testdata"' <<< "$datasource_response"
dashboard_response="$(request_grafana "${GRAFANA_BASE_URL}/api/dashboards/uid/demo-dashboard")"
grep -Eq '"uid"[[:space:]]*:[[:space:]]*"demo-dashboard"' <<< "$dashboard_response"

query_payload='{"queries":[{"refId":"A","datasource":{"type":"grafana-testdata-datasource","uid":"testdata"},"scenarioId":"random_walk"}],"from":"now-15m","to":"now"}'
query_response="$(request_grafana \
  -H 'Content-Type: application/json' \
  -X POST \
  -d "$query_payload" \
  "${GRAFANA_BASE_URL}/api/ds/query")"
grep -q '"frames"' <<< "$query_response"

if [ -n "$APP_BASE_URL" ]; then
  app_ready=0
  for attempt in $(seq 1 90); do
    if [ -n "$APP_PID" ] && ! kill -0 "$APP_PID" 2>/dev/null; then
      echo "Application process exited before becoming healthy" >&2
      exit 1
    fi
    if curl -fsS "${APP_BASE_URL}/api/grafana/api/health" >/dev/null 2>&1; then
      app_ready=1
      break
    fi
    sleep 2
  done
  if [ "$app_ready" -ne 1 ]; then
    echo "Application proxy did not become healthy at ${APP_BASE_URL}" >&2
    exit 1
  fi
  proxy_datasource_response="$(curl -fsS "${APP_BASE_URL}/api/grafana/api/datasources/uid/testdata")"
  grep -Eq '"uid"[[:space:]]*:[[:space:]]*"testdata"' <<< "$proxy_datasource_response"
  proxy_dashboard_response="$(curl -fsS "${APP_BASE_URL}/api/grafana/api/dashboards/uid/demo-dashboard")"
  grep -Eq '"uid"[[:space:]]*:[[:space:]]*"demo-dashboard"' <<< "$proxy_dashboard_response"
  proxy_query_response="$(curl -fsS \
    -H 'Content-Type: application/json' \
    -X POST \
    -d "$query_payload" \
    "${APP_BASE_URL}/api/grafana/api/ds/query")"
  grep -q '"frames"' <<< "$proxy_query_response"
  dashboard_page="$(curl -fsS "${APP_BASE_URL}/dashboard")"
  grep -q 'demo-dashboard' <<< "$dashboard_page"
fi

echo "Grafana validation passed"
