# SKL-005 Branching Matrix

## Auth Branch Entry
- NextAuth branch: repository uses NextAuth server session.
- Clerk branch: repository uses Clerk server auth APIs.
- Custom session branch: repository has custom session store.

## Topology Branch Entry
- Host + Docker Grafana: `GRAFANA_INTERNAL_URL=http://localhost:3001`
- App container + Grafana container: `GRAFANA_INTERNAL_URL=http://grafana:3000`

## Tie-Break Order
1. Existing auth framework in repo
2. Runtime topology detection
3. Fallback to custom session path

## Shared Rules
- Role mapping must output `Admin|Editor|Viewer`.
- Route contract must stay aligned with Grafana sub-path config.
