# Setup Plan Generation

## Objective
- Convert repository recognition output into a deterministic implementation plan.

## Inputs
- Recognition result from `repository-recognition.md`.
- Existing project conventions from source and tests.

## Plan Phases
1. Preflight
   - Confirm env keys and Grafana endpoint.
   - Confirm route location target (`/api/grafana/[...path]/route.ts`).
2. Install and imports
   - Ensure `next-grafana-auth` package import paths are correct.
3. Proxy route integration
   - Wire `handleGrafanaProxy()` with trusted `userEmail` and `userRole`.
4. Dashboard embed integration
   - Render `<GrafanaDashboard />` with safe `baseUrl`.
5. Environment and Grafana config
   - Align `pathPrefix` with Grafana `root_url` and sub-path settings.

## Branch Rules
- `authPattern=nextauth`: fetch identity from NextAuth session.
- `authPattern=session`: resolve identity from session cookie store.
- `authPattern=custom`: call custom session backend and map role.
- `networkTopology=host-docker`: use localhost-exposed Grafana URL.
- `networkTopology=docker-docker`: use service DNS URL.

## Verification Per Phase
- Proxy route compiles and handles a smoke GET request.
- Dashboard iframe URL resolves to proxy base path.
- Lint/typecheck/test commands pass.

## Completion Signal
- Proxy requests return expected status and headers.
- Dashboard loads through proxy route.
- No blocking diagnostics remain.

## Next Route
- Primary: `docs/ai-setup/execution-protocol.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
