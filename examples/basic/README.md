# Basic Example - next-grafana-auth

Minimal example showing how to embed Grafana dashboards with next-grafana-auth using a hardcoded demo user (no authentication required).

## Setup

1. **Install dependencies:**
```bash
cd examples/basic
npm ci
```

2. **Configure environment:**
```bash
cp .env.example .env
```

The default `GRAFANA_INTERNAL_URL` is `http://localhost:3001`, which matches the `docker-compose.yml` port mapping (`3001:3000`).
If you run Next.js inside Docker on the same network as Grafana, change it to `http://grafana:3000`.

3. **Start Grafana:**
```bash
cd ..
docker compose up -d
```

4. **Start Next.js:**
```bash
cd examples/basic
npm run dev
```

5. **Visit:**
- Home page: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

## Files

- `app/api/grafana/[...path]/route.ts` - Proxy handler with hardcoded demo user
- `app/dashboard/page.tsx` - Dashboard page with embedded Grafana
- `app/page.tsx` - Home page with instructions

## Configuration

This example ships with a provisioned demo dashboard (`uid: demo-dashboard`) that uses Grafana's built-in TestData datasource to generate live mock data — no external database required. The dashboard includes:

- **Server Metrics** — time series with 3 random walk series
- **CPU Usage** — stat panel with color thresholds
- **Memory Usage** — gauge visualization
- **Request Rate** — bar chart with predictable wave data
- **Response Latency** — horizontal bar gauge for 4 endpoints

Open `/dashboard` to verify the embedded Grafana view immediately after startup.
To customize, edit `examples/provisioning/dashboards/json/demo-dashboard.json`.

## Code Statistics

- **Proxy route:** ~30 lines
- **Dashboard page:** ~15 lines
- **Total user code:** ~45 lines

## Customizing

This example uses a hardcoded demo user (`user@example.com` / `Admin` role) with no authentication.
For production:

1. Add session validation (check a cookie, JWT, or OAuth token)
2. Load the real user from your auth system
3. Map your application roles to Grafana roles (`Admin`, `Editor`, `Viewer`)

See the `nextauth/` and `custom-session/` examples for production-ready authentication implementations.
